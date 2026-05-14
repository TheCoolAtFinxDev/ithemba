import {
  Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardPatientDto, UpdatePatientAddressDto, TopUpDto, AddBeneficiaryDto, UpdatePatientProfileDto } from './patients.dto';

const REGISTRATION_FEE = 67;

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

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
    // Check not already onboarded
    const existing = await this.prisma.patient.findUnique({
      where: { userProfileId },
    });
    if (existing) {
      throw new ConflictException('Patient profile already exists');
    }

    // Create patient + HSA in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create patient record
      const patient = await tx.patient.create({
        data: {
          userProfileId,
          phoneNumber: dto.phoneNumber,
          nationalId: dto.nationalId,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          isActive: true,
          createdBy: userProfileId,
        },
      });

      // Create HSA
      const hsa = await tx.healthSavingsAccount.create({
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

      // Deduct registration fee transaction record
      await tx.savingsTransaction.create({
        data: {
          accountId: hsa.id,
          patientId: patient.id,
          transactionType: 'Debit',
          amount: REGISTRATION_FEE,
          notes: 'Once-off registration fee',
          isSuccessful: true,
        },
      });

      // Log audit
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

    return result.patient;
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

    if (dto.amount < 500 || dto.amount > 10000) {
      throw new BadRequestException('Top-up must be between R500 and R10,000');
    }

    return this.prisma.$transaction(async (tx) => {
      const record = await tx.savingsTransaction.create({
        data: {
          accountId: account.id,
          patientId: patient.id,
          transactionType: 'Deposit',
          amount: dto.amount,
          mpesaTransactionCode: dto.mpesaRef,
          notes: dto.mpesaPhone
            ? `M-Pesa top-up from ${dto.mpesaPhone}`
            : 'M-Pesa top-up (stub)',
          isSuccessful: true,
        },
      });

      await tx.healthSavingsAccount.update({
        where: { id: account.id },
        data: {
          balance: { increment: dto.amount },
          totalContributed: { increment: dto.amount },
        },
      });

      return record;
    });
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
