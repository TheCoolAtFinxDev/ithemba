import {
  Injectable, Logger, NotFoundException, ConflictException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardPatientDto, UpdatePatientAddressDto, TopUpDto, AddBeneficiaryDto, UpdatePatientProfileDto } from './patients.dto';
import { GolinkService } from '../golink/golink.service';
import { NovuService } from '../novu/novu.service';
import { readSetting } from '../common/settings.helper';

const REGISTRATION_FEE_DEFAULT = 67;

function toYyyymmdd(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(private prisma: PrismaService, private golink: GolinkService, private novu: NovuService) {}

  async getProfile(userProfileId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userProfileId },
      include: {
        userProfile: true,
        savingsAccount: true,
        beneficiaries: { where: { isActive: true } },
      },
    });
    return patient;
  }

  async onboard(userProfileId: string, dto: OnboardPatientDto) {
    const existing = await this.prisma.patient.findUnique({
      where: { userProfileId },
      include: { savingsAccount: true },
    });

    const registrationFee = await readSetting(this.prisma, 'registrationFee', REGISTRATION_FEE_DEFAULT);

    const result = await this.prisma.$transaction(async (tx) => {
      let patient;
      let hsa;

      const address = [dto.addressLine1, dto.city, dto.district].filter(Boolean).join(', ') || undefined;

      if (existing) {
        // Profile was auto-provisioned on sync — update with submitted details
        patient = await tx.patient.update({
          where: { userProfileId },
          data: {
            phoneNumber: dto.phoneNumber,
            nationalId: dto.nationalId ?? existing.nationalId,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : existing.dateOfBirth,
            ...(address && { address }),
            lastModifiedBy: userProfileId,
          },
        });
        hsa = existing.savingsAccount;

        if (!hsa) {
          hsa = await tx.healthSavingsAccount.create({
            data: {
              patientId: patient.id,
              balance: 0,
              totalContributed: 0,
              totalClaimed: 0,
              isDefault: true,
              autoDebitEnabled: dto.autoDebitEnabled ?? false,
              debitSourceMpesaNumber: dto.debitSourceMpesaNumber,
              createdBy: userProfileId,
            },
          });
        } else {
          await tx.healthSavingsAccount.update({
            where: { id: hsa.id },
            data: {
              autoDebitEnabled: dto.autoDebitEnabled ?? hsa.autoDebitEnabled,
              debitSourceMpesaNumber: dto.debitSourceMpesaNumber ?? hsa.debitSourceMpesaNumber,
            },
          });
        }
      } else {
        patient = await tx.patient.create({
          data: {
            userProfileId,
            phoneNumber: dto.phoneNumber,
            nationalId: dto.nationalId,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
            ...(address && { address }),
            isActive: true,
            createdBy: userProfileId,
          },
        });
        hsa = await tx.healthSavingsAccount.create({
          data: {
            patientId: patient.id,
            balance: 0,
            totalContributed: 0,
            totalClaimed: 0,
            isDefault: true,
            autoDebitEnabled: dto.autoDebitEnabled ?? false,
            debitSourceMpesaNumber: dto.debitSourceMpesaNumber,
            createdBy: userProfileId,
          },
        });
      }

      // Record R67 registration fee only once (if no prior fee transaction exists)
      const feeExists = await tx.savingsTransaction.count({
        where: { accountId: hsa.id, notes: 'Once-off registration fee' },
      });
      if (feeExists === 0) {
        await tx.savingsTransaction.create({
          data: {
            accountId: hsa.id,
            patientId: patient.id,
            transactionType: 'Debit',
            amount: registrationFee,
            notes: 'Once-off registration fee',
            isSuccessful: true,
          },
        });
      }

      await tx.auditLogEntry.create({
        data: {
          userId: userProfileId,
          action: 'PATIENT_ONBOARDED',
          entity: 'Patient',
          entityId: patient.id,
          newValues: { phoneNumber: dto.phoneNumber },
        },
      });

      return { patient, hsa };
    });

    await this.linkPendingEmployerInvite(result.patient, userProfileId)
      .catch(err => this.logger.error(`Failed to auto-link employer invite for patient ${result.patient.id}`, err));

    return result.patient;
  }

  // If this person registered via an employer's bulk-enrollment invite link,
  // their email will match a Pending EmployerInvite — complete that enrollment
  // now that they have a real Patient record to attach it to.
  private async linkPendingEmployerInvite(patient: { id: string }, userProfileId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { id: userProfileId },
      select: { email: true, fullName: true },
    });
    if (!profile) return;

    const invite = await this.prisma.employerInvite.findFirst({
      where: { email: { equals: profile.email, mode: 'insensitive' }, status: 'Pending', expiresAt: { gt: new Date() } },
      include: { employer: { select: { id: true, name: true } } },
    });
    if (!invite) return;

    const alreadyMember = await this.prisma.employerMembership.findUnique({
      where: { employerId_patientId: { employerId: invite.employerId, patientId: patient.id } },
    });
    if (alreadyMember) return;

    await this.prisma.$transaction([
      this.prisma.employerMembership.create({
        data: {
          employerId: invite.employerId,
          patientId: patient.id,
          employeeRef: invite.employeeRef,
          contributionAmount: invite.contributionAmount,
          createdBy: userProfileId,
        },
      }),
      this.prisma.employerInvite.update({
        where: { id: invite.id },
        data: { status: 'Accepted', acceptedAt: new Date(), patientId: patient.id },
      }),
    ]);

    await this.novu.sendMemberEnrolled({
      subscriberId: userProfileId,
      email: profile.email,
      firstName: profile.fullName?.split(' ')[0] ?? 'there',
      employerName: invite.employer.name,
      contributionAmount: Number(invite.contributionAmount),
    });
  }

  async updateProfile(userProfileId: string, dto: UpdatePatientProfileDto) {
    const patient = await this.prisma.patient.findUnique({ where: { userProfileId } });
    if (!patient) throw new NotFoundException('Patient not found');

    const data: any = { lastModifiedBy: userProfileId };
    if (dto.phoneNumber !== undefined) data.phoneNumber = dto.phoneNumber;
    if (dto.nationalId !== undefined) data.nationalId = dto.nationalId;
    if (dto.dateOfBirth !== undefined) data.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;

    return this.prisma.patient.update({ where: { userProfileId }, data });
  }

  // ── Notification preferences ────────────────────────────────

  async getNotificationPreferences(userProfileId: string) {
    const pref = await this.prisma.notificationPreference.findUnique({ where: { userProfileId } });
    return pref ?? { emailEnabled: true, smsEnabled: true, reminderAdvanceHours: 24 };
  }

  async updateNotificationPreferences(
    userProfileId: string,
    dto: { emailEnabled?: boolean; smsEnabled?: boolean; reminderAdvanceHours?: number },
  ) {
    return this.prisma.notificationPreference.upsert({
      where: { userProfileId },
      create: {
        userProfileId,
        emailEnabled: dto.emailEnabled ?? true,
        smsEnabled: dto.smsEnabled ?? true,
        reminderAdvanceHours: dto.reminderAdvanceHours ?? 24,
      },
      update: {
        ...(dto.emailEnabled !== undefined ? { emailEnabled: dto.emailEnabled } : {}),
        ...(dto.smsEnabled !== undefined ? { smsEnabled: dto.smsEnabled } : {}),
        ...(dto.reminderAdvanceHours !== undefined ? { reminderAdvanceHours: dto.reminderAdvanceHours } : {}),
      },
    });
  }

  async updateAddress(userProfileId: string, dto: UpdatePatientAddressDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { userProfileId },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    return this.prisma.patient.update({
      where: { userProfileId },
      data: {
        address: [dto.addressLine1, dto.city, dto.district, dto.country]
          .filter(Boolean)
          .join(', '),
        lastModifiedBy: userProfileId,
      },
    });
  }

  // ── Wallet ───────────────────────────────────────────────────

  private async resolvePatient(patientId: string, requestingUserId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Patient not found');
    if (patient.userProfileId !== requestingUserId) throw new ForbiddenException();
    return patient;
  }

  async getWallet(userProfileId: string, patientId: string) {
    const patient = await this.resolvePatient(patientId, userProfileId);
    const account = await this.prisma.healthSavingsAccount.findUnique({
      where: { patientId: patient.id },
    });
    if (!account) throw new NotFoundException('Wallet not found');
    return account;
  }

  async topup(userProfileId: string, patientId: string, dto: TopUpDto) {
    const patient = await this.resolvePatient(patientId, userProfileId);
    const account = await this.prisma.healthSavingsAccount.findUnique({
      where: { patientId: patient.id },
    });
    if (!account) throw new NotFoundException('Wallet not found');

    const minContrib = await readSetting(this.prisma, 'minMonthlyContribution', 500);
    const maxContrib = await readSetting(this.prisma, 'maxMonthlyContribution', 10000);
    if (dto.amount < minContrib || dto.amount > maxContrib) {
      throw new BadRequestException(`Top-up must be between R${minContrib} and R${maxContrib}`);
    }

    const userProfile = await this.prisma.userProfile.findUnique({ where: { id: userProfileId } });
    const idempotencyKey = this.golink.newIdempotencyKey();

    // Created Processing, *before* the external call — so the idempotency key
    // is durable even if our own process dies mid-request and the caller retries.
    const txn = await this.prisma.savingsTransaction.create({
      data: {
        accountId: account.id,
        patientId: patient.id,
        transactionType: 'Deposit',
        amount: dto.amount,
        status: 'Processing',
        isSuccessful: false,
        idempotencyKey,
        notes: `${dto.rail} top-up from ${dto.mpesaPhone}`,
      },
    });

    try {
      const result = await this.golink.createPayment({
        idempotencyKey,
        rail: dto.rail,
        amountMinor: Math.round(dto.amount * 100),
        currency: 'LSL',
        payerPhone: dto.mpesaPhone,
        payerName: userProfile?.fullName ?? 'Patient',
        sourceReference: txn.id,
      });

      // Collections are documented as async (PROCESSING → webhook), but handle
      // a synchronous final status defensively rather than assume.
      if (result.status === 'SUCCEEDED') {
        const updated = await this.prisma.$transaction(async (tx) => {
          const updated = await tx.savingsTransaction.update({
            where: { id: txn.id },
            data: { status: 'Succeeded', isSuccessful: true, golinkPaymentId: result.id },
          });
          await tx.healthSavingsAccount.update({
            where: { id: account.id },
            data: { balance: { increment: dto.amount }, totalContributed: { increment: dto.amount } },
          });
          return updated;
        });
        if (userProfile) {
          await this.novu.sendTopupSucceeded({
            subscriberId: userProfile.id, email: userProfile.email,
            firstName: userProfile.fullName?.split(' ')[0] ?? 'there',
            amount: dto.amount, newBalance: Number(account.balance) + dto.amount,
          });
        }
        return updated;
      }

      if (result.status === 'FAILED') {
        const updated = await this.prisma.savingsTransaction.update({
          where: { id: txn.id },
          data: { status: 'Failed', isSuccessful: false, golinkPaymentId: result.id, failureReason: result.failureReason },
        });
        if (userProfile) {
          await this.novu.sendTopupFailed({
            subscriberId: userProfile.id, email: userProfile.email,
            firstName: userProfile.fullName?.split(' ')[0] ?? 'there',
            amount: dto.amount, reason: result.failureReason ?? 'Payment declined',
          });
        }
        return updated;
      }

      return this.prisma.savingsTransaction.update({
        where: { id: txn.id },
        data: { golinkPaymentId: result.id },
      });
    } catch (err: any) {
      const reason = err?.message ?? 'Payment request failed';
      await this.prisma.savingsTransaction.update({
        where: { id: txn.id },
        data: { status: 'Failed', isSuccessful: false, failureReason: reason },
      });
      if (userProfile) {
        await this.novu.sendTopupFailed({
          subscriberId: userProfile.id, email: userProfile.email,
          firstName: userProfile.fullName?.split(' ')[0] ?? 'there',
          amount: dto.amount, reason,
        });
      }
      throw err;
    }
  }

  async getTransactions(userProfileId: string, patientId: string) {
    const patient = await this.resolvePatient(patientId, userProfileId);
    const account = await this.prisma.healthSavingsAccount.findUnique({
      where: { patientId: patient.id },
    });
    if (!account) return [];

    return this.prisma.savingsTransaction.findMany({
      where: { accountId: account.id },
      orderBy: { transactionDate: 'desc' },
      take: 50,
    });
  }

  // ── Auto-debit (configuration only — no real M-Pesa charge yet) ─

  async getAutoDebit(userProfileId: string, patientId: string) {
    const patient = await this.resolvePatient(patientId, userProfileId);
    const account = await this.prisma.healthSavingsAccount.findUnique({
      where: { patientId: patient.id },
      include: { autoDebitSetup: true },
    });
    if (!account) throw new NotFoundException('Wallet not found');
    return account.autoDebitSetup;
  }

  async setupAutoDebit(userProfileId: string, patientId: string, dto: {
    mpesaNumber: string; amount: number; frequency: 'Weekly' | 'Monthly';
  }) {
    const patient = await this.resolvePatient(patientId, userProfileId);
    const account = await this.prisma.healthSavingsAccount.findUnique({
      where: { patientId: patient.id },
    });
    if (!account) throw new NotFoundException('Wallet not found');

    if (dto.amount < 500 || dto.amount > 10000) {
      throw new BadRequestException('Auto top-up amount must be between R500 and R10,000');
    }

    const daysUntilNext = dto.frequency === 'Weekly' ? 7 : 30;
    const nextDebitDate = new Date(Date.now() + daysUntilNext * 24 * 60 * 60 * 1000);
    const expiryDate = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000);

    const mandate = await this.golink.createMandate({
      customerPhone: dto.mpesaNumber,
      reference: account.id,
      frequency: dto.frequency,
      firstPaymentDate: toYyyymmdd(nextDebitDate),
      expiryDate: toYyyymmdd(expiryDate),
    });

    const setup = await this.prisma.autoDebitSetup.upsert({
      where: { accountId: account.id },
      create: {
        accountId: account.id,
        mpesaNumber: dto.mpesaNumber,
        amount: dto.amount,
        frequency: dto.frequency,
        nextDebitDate,
        isActive: true,
        golinkMandateId: mandate.id,
      },
      update: {
        mpesaNumber: dto.mpesaNumber,
        amount: dto.amount,
        frequency: dto.frequency,
        nextDebitDate,
        isActive: true,
        golinkMandateId: mandate.id,
      },
    });

    await this.prisma.healthSavingsAccount.update({
      where: { id: account.id },
      data: { autoDebitEnabled: true, debitSourceMpesaNumber: dto.mpesaNumber },
    });

    return setup;
  }

  async cancelAutoDebit(userProfileId: string, patientId: string) {
    const patient = await this.resolvePatient(patientId, userProfileId);
    const account = await this.prisma.healthSavingsAccount.findUnique({
      where: { patientId: patient.id },
      include: { autoDebitSetup: true },
    });
    if (!account) throw new NotFoundException('Wallet not found');

    if (account.autoDebitSetup?.golinkMandateId) {
      await this.golink.cancelMandate(account.autoDebitSetup.golinkMandateId);
    }

    await this.prisma.autoDebitSetup.updateMany({
      where: { accountId: account.id },
      data: { isActive: false },
    });
    await this.prisma.healthSavingsAccount.update({
      where: { id: account.id },
      data: { autoDebitEnabled: false },
    });

    return { message: 'Auto top-up cancelled' };
  }

  // ── Beneficiaries ─────────────────────────────────────────────

  async listBeneficiaries(userProfileId: string, patientId: string) {
    await this.resolvePatient(patientId, userProfileId);
    return this.prisma.beneficiary.findMany({
      where: { patientId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addBeneficiary(userProfileId: string, patientId: string, dto: AddBeneficiaryDto) {
    await this.resolvePatient(patientId, userProfileId);
    return this.prisma.beneficiary.create({
      data: {
        patientId,
        fullName: dto.fullName,
        relationship: dto.relationship,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        nationalId: dto.nationalId,
        phoneNumber: dto.phoneNumber,
        isActive: true,
        createdBy: userProfileId,
      },
    });
  }

  async removeBeneficiary(userProfileId: string, patientId: string, beneficiaryId: string) {
    await this.resolvePatient(patientId, userProfileId);
    const ben = await this.prisma.beneficiary.findUnique({ where: { id: beneficiaryId } });
    if (!ben || ben.patientId !== patientId) throw new NotFoundException('Beneficiary not found');
    return this.prisma.beneficiary.update({
      where: { id: beneficiaryId },
      data: { isActive: false, lastModifiedBy: userProfileId },
    });
  }

  async findById(patientId: string, requestingUserId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        userProfile: true,
        savingsAccount: true,
        beneficiaries: { where: { isActive: true } },
      },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    // Patients can only view their own record
    if (patient.userProfileId !== requestingUserId) {
      const requester = await this.prisma.userRole.findFirst({
        where: {
          userProfileId: requestingUserId,
          role: { name: 'ADMIN' },
        },
        include: { role: true },
      });
      if (!requester) throw new ForbiddenException();
    }

    return patient;
  }
}
