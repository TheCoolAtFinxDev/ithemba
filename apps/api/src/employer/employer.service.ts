import {
  Injectable, Logger, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Wso2Service } from '../wso2/wso2.service';
import { NovuService } from '../novu/novu.service';
import { AuthService } from '../auth/auth.service';
import { GolinkService } from '../golink/golink.service';
import {
  CreateEmployerDto, UpdateEmployerDto, AddMemberDto, UpdateMemberDto,
  UploadContributionsDto, GenerateInvoiceDto, ConfirmPaymentDto,
  BulkEnrollDto, BulkEnrollRowDto,
} from './employer.dto';

const INVITE_TTL_DAYS = 14;

@Injectable()
export class EmployerService {
  private readonly logger = new Logger(EmployerService.name);

  constructor(
    private prisma: PrismaService,
    private wso2: Wso2Service,
    private novu: NovuService,
    private authService: AuthService,
    private golink: GolinkService,
  ) {}

  // ── Admin: create employer + WSO2 user + welcome email ───────────────────

  async create(dto: CreateEmployerDto, adminId: string) {
    const contactName = `${dto.contactFirstName} ${dto.contactLastName}`;

    // Check email isn't already in use
    const existingProfile = await this.prisma.userProfile.findUnique({ where: { email: dto.contactEmail } });
    if (existingProfile) throw new ConflictException('A user with this email already exists');

    // 1. Create WSO2 user in EMPLOYER group
    const { id: wso2UserId, temporaryPassword } = await this.wso2.createUser({
      email: dto.contactEmail,
      firstName: dto.contactFirstName,
      lastName: dto.contactLastName,
      phoneNumber: dto.contactPhone,
    });

    await this.wso2.assignGroup(wso2UserId, 'EMPLOYER', dto.contactEmail);

    // 2. Pre-create UserProfile + assign EMPLOYER role (same as registration flow)
    await this.authService.sync(wso2UserId, {
      email: dto.contactEmail,
      fullName: contactName,
      role: 'EMPLOYER',
    });

    // 3. Create employer record linked to this user
    const employer = await this.prisma.employer.create({
      data: {
        name: dto.name,
        registrationNumber: dto.registrationNumber,
        contactName,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        contactUserProfileId: wso2UserId,
        platformFeePerSeat: dto.platformFeePerSeat ?? 50,
        isActive: true,
        isVerified: false,
        createdBy: adminId,
      },
    });

    // 4. Send welcome email with temporary password
    await this.novu.sendWelcome({
      email: dto.contactEmail,
      firstName: dto.contactFirstName,
      temporaryPassword,
      loginUrl: 'http://169.239.181.30/employer',
    });

    await this.novu.notifyAdminsNewEmployer({ companyName: employer.name });

    this.logger.log(`Employer created: ${employer.name} (${dto.contactEmail}) — pending verification`);

    return { ...employer, temporaryPassword };
  }

  async listAll() {
    return this.prisma.employer.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { memberships: true, billingCycles: true } } },
    });
  }

  async verify(employerId: string, adminId: string) {
    const employer = await this.findEmployerOrThrow(employerId);
    if (employer.isVerified) throw new BadRequestException('Employer is already verified');

    const wso2OrganizationId = await this.wso2.createOrganization(
      employer.name,
      `Ithemba Health employer tenant — ${employer.name}`,
    );

    return this.prisma.employer.update({
      where: { id: employerId },
      data: {
        isVerified: true, verifiedAt: new Date(), verifiedBy: adminId,
        ...(wso2OrganizationId ? { wso2OrganizationId } : {}),
      },
    });
  }

  async setActive(employerId: string, isActive: boolean) {
    await this.findEmployerOrThrow(employerId);
    return this.prisma.employer.update({ where: { id: employerId }, data: { isActive } });
  }

  // ── Employer: own account ─────────────────────────────────────────────────

  async getMyEmployer(userProfileId: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { contactUserProfileId: userProfileId },
      include: { _count: { select: { memberships: true } } },
    });
    if (!employer) throw new NotFoundException('No employer account linked to this user');
    return employer;
  }

  async update(employerId: string, dto: UpdateEmployerDto) {
    await this.findEmployerOrThrow(employerId);
    return this.prisma.employer.update({ where: { id: employerId }, data: dto });
  }

  // ── Members ───────────────────────────────────────────────────────────────

  async listMembers(employerId: string) {
    await this.findEmployerOrThrow(employerId);
    return this.prisma.employerMembership.findMany({
      where: { employerId },
      include: {
        patient: { include: { userProfile: { select: { email: true, fullName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addMember(employerId: string, dto: AddMemberDto, actorId: string) {
    const employer = await this.findVerifiedEmployerOrThrow(employerId);

    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
      include: { userProfile: { select: { id: true, fullName: true, email: true } } },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    return this.linkPatientToEmployer(employer, patient, dto.employeeRef, dto.contributionAmount, actorId);
  }

  // Shared by addMember() and bulkEnroll() — creates or reactivates a
  // membership for a patient that already exists, and sends the enrolled notice.
  private async linkPatientToEmployer(
    employer: { id: string; name: string },
    patient: { id: string; userProfile: { id: string; fullName: string; email: string } | null },
    employeeRef: string,
    contributionAmount: number,
    actorId: string,
  ) {
    const employerId = employer.id;
    const exists = await this.prisma.employerMembership.findUnique({
      where: { employerId_patientId: { employerId, patientId: patient.id } },
    });
    if (exists && exists.status !== 'Terminated') {
      throw new ConflictException('Patient is already an active member of this employer');
    }

    let membership;
    if (exists?.status === 'Terminated') {
      membership = await this.prisma.employerMembership.update({
        where: { id: exists.id },
        data: {
          employeeRef,
          contributionAmount,
          status: 'Active',
          startDate: new Date(),
          endDate: null,
        },
      });
    } else {
      membership = await this.prisma.employerMembership.create({
        data: {
          employerId,
          patientId: patient.id,
          employeeRef,
          contributionAmount,
          createdBy: actorId,
        },
      });
    }

    if (patient.userProfile?.email) {
      await this.novu.sendMemberEnrolled({
        subscriberId: patient.userProfile.id, email: patient.userProfile.email,
        firstName: patient.userProfile.fullName?.split(' ')[0] ?? 'there',
        employerName: employer.name, contributionAmount,
      });
    }

    return membership;
  }

  // ── Bulk enrollment ──────────────────────────────────────────────────────
  // Rows matching an existing patient (by email or phone) are linked immediately;
  // rows with no matching account get an EmployerInvite + notification, and are
  // auto-linked once that person completes patient registration (see
  // PatientsService.onboard → linkPendingEmployerInvite).
  async bulkEnroll(employerId: string, dto: BulkEnrollDto, actorId: string) {
    const employer = await this.findVerifiedEmployerOrThrow(employerId);

    const results: Array<{ row: number; employeeRef: string; outcome: 'linked' | 'invited' | 'error'; message?: string }> = [];

    for (let i = 0; i < dto.rows.length; i++) {
      const row = dto.rows[i];
      try {
        const outcome = await this.enrollOneRow(employer, row, actorId);
        results.push({ row: i, employeeRef: row.employeeRef, outcome });
      } catch (err: any) {
        results.push({
          row: i,
          employeeRef: row.employeeRef,
          outcome: 'error',
          message: err instanceof ConflictException || err instanceof BadRequestException || err instanceof NotFoundException
            ? err.message
            : err?.code === 'P2002'
              ? `Payroll ref "${row.employeeRef}" is already used by another row or member`
              : 'Failed to enroll this row',
        });
      }
    }

    return {
      linked: results.filter(r => r.outcome === 'linked').length,
      invited: results.filter(r => r.outcome === 'invited').length,
      failed: results.filter(r => r.outcome === 'error').length,
      results,
    };
  }

  private async findPatientByEmailOrPhone(email: string, phoneNumber: string) {
    return this.prisma.patient.findFirst({
      where: {
        OR: [
          { userProfile: { email: { equals: email, mode: 'insensitive' } } },
          { phoneNumber },
        ],
      },
      include: { userProfile: { select: { id: true, fullName: true, email: true } } },
    });
  }

  private async enrollOneRow(employer: { id: string; name: string }, row: BulkEnrollRowDto, actorId: string): Promise<'linked' | 'invited'> {
    const patient = await this.findPatientByEmailOrPhone(row.email, row.phoneNumber);

    if (patient) {
      await this.linkPatientToEmployer(employer, patient, row.employeeRef, row.contributionAmount, actorId);
      return 'linked';
    }

    // No account yet — upsert a pending invite for this employeeRef and send it.
    const existingInvite = await this.prisma.employerInvite.findUnique({
      where: { employerId_employeeRef: { employerId: employer.id, employeeRef: row.employeeRef } },
    });
    if (existingInvite && existingInvite.status === 'Pending') {
      throw new ConflictException(`An invite for payroll ref "${row.employeeRef}" is already pending`);
    }
    if (existingInvite && existingInvite.status === 'Accepted') {
      throw new ConflictException(`Payroll ref "${row.employeeRef}" is already enrolled`);
    }

    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
    const invite = existingInvite
      ? await this.prisma.employerInvite.update({
          where: { id: existingInvite.id },
          data: {
            firstName: row.firstName, lastName: row.lastName, email: row.email, phoneNumber: row.phoneNumber,
            contributionAmount: row.contributionAmount, status: 'Pending', expiresAt, patientId: null, acceptedAt: null,
            createdBy: actorId,
          },
        })
      : await this.prisma.employerInvite.create({
          data: {
            employerId: employer.id,
            firstName: row.firstName, lastName: row.lastName, email: row.email, phoneNumber: row.phoneNumber,
            employeeRef: row.employeeRef, contributionAmount: row.contributionAmount, expiresAt,
            createdBy: actorId,
          },
        });

    await this.novu.sendEmployerInvite({
      email: invite.email,
      firstName: invite.firstName,
      employerName: employer.name,
      contributionAmount: row.contributionAmount,
      registerUrl: `https://myhealth.ithembahealth.com/register?invite=${invite.token}`,
    });

    return 'invited';
  }

  async updateMember(employerId: string, membershipId: string, dto: UpdateMemberDto) {
    const membership = await this.findMembershipOrThrow(employerId, membershipId);
    if (membership.status === 'Terminated') {
      throw new BadRequestException('Cannot update a terminated membership');
    }
    return this.prisma.employerMembership.update({ where: { id: membershipId }, data: dto });
  }

  async suspendMember(employerId: string, membershipId: string) {
    const [employer, m] = await Promise.all([
      this.findEmployerOrThrow(employerId),
      this.findMembershipOrThrow(employerId, membershipId),
    ]);
    if (m.status !== 'Active') throw new BadRequestException('Membership is not active');
    const updated = await this.prisma.employerMembership.update({
      where: { id: membershipId },
      data: { status: 'Suspended' },
    });

    const patient = await this.prisma.patient.findUnique({
      where: { id: m.patientId },
      include: { userProfile: { select: { id: true, fullName: true, email: true } } },
    });
    if (patient?.userProfile?.email) {
      await this.novu.sendMemberSuspended({
        subscriberId: patient.userProfile.id, email: patient.userProfile.email,
        firstName: patient.userProfile.fullName?.split(' ')[0] ?? 'there',
        employerName: employer.name,
      });
    }

    return updated;
  }

  async terminateMember(employerId: string, membershipId: string) {
    const [employer, m] = await Promise.all([
      this.findEmployerOrThrow(employerId),
      this.findMembershipOrThrow(employerId, membershipId),
    ]);
    const updated = await this.prisma.employerMembership.update({
      where: { id: membershipId },
      data: { status: 'Terminated', endDate: new Date() },
    });

    const patient = await this.prisma.patient.findUnique({
      where: { id: m.patientId },
      include: { userProfile: { select: { id: true, fullName: true, email: true } } },
    });
    if (patient?.userProfile?.email) {
      await this.novu.sendMemberTerminated({
        subscriberId: patient.userProfile.id, email: patient.userProfile.email,
        firstName: patient.userProfile.fullName?.split(' ')[0] ?? 'there',
        employerName: employer.name,
      });
    }

    return updated;
  }

  // ── Contribution upload (payroll push / CSV / manual) ─────────────────────

  private async matchContributions(employerId: string, contributions: { employeeRef: string; amount: number }[]) {
    const activeMembers = await this.prisma.employerMembership.findMany({
      where: { employerId, status: 'Active' },
      include: { patient: { include: { userProfile: { select: { fullName: true } } } } },
    });

    const memberByRef = new Map(activeMembers.map(m => [m.employeeRef, m]));

    const matched: Array<typeof activeMembers[0] & { uploadedAmount: number }> = [];
    const unmatched: string[] = [];

    for (const line of contributions) {
      const member = memberByRef.get(line.employeeRef);
      if (member) {
        matched.push({ ...member, uploadedAmount: line.amount });
      } else {
        unmatched.push(line.employeeRef);
      }
    }

    return { matched, unmatched };
  }

  async uploadContributions(employerId: string, dto: UploadContributionsDto) {
    await this.findVerifiedEmployerOrThrow(employerId);

    const { matched, unmatched } = await this.matchContributions(employerId, dto.contributions);
    const subtotal = matched.reduce((sum, m) => sum + m.uploadedAmount, 0);

    return {
      billingMonth: dto.billingMonth,
      matchedCount: matched.length,
      unmatchedRefs: unmatched,
      subtotal,
      preview: matched.map(m => ({
        membershipId: m.id,
        employeeRef: m.employeeRef,
        employeeName: m.patient.userProfile.fullName,
        amount: m.uploadedAmount,
      })),
    };
  }

  // Commits a previewed contribution batch: persists each matched member's
  // new contributionAmount, then generates the invoice off those amounts.
  // Without this, "preview" was a dead end — generateInvoice reads whatever
  // contributionAmount is already stored on each membership, not upload data.
  async confirmContributionUpload(employerId: string, dto: UploadContributionsDto, actorId: string) {
    await this.findVerifiedEmployerOrThrow(employerId);

    const { matched, unmatched } = await this.matchContributions(employerId, dto.contributions);
    if (matched.length === 0) {
      throw new BadRequestException('No matching active members to update');
    }

    await this.prisma.$transaction(
      matched.map(m => this.prisma.employerMembership.update({
        where: { id: m.id },
        data: { contributionAmount: m.uploadedAmount },
      })),
    );

    const cycle = await this.generateInvoice(employerId, { billingMonth: dto.billingMonth }, actorId);
    return { cycle, updatedCount: matched.length, unmatchedRefs: unmatched };
  }

  // ── Billing cycles ────────────────────────────────────────────────────────

  async generateInvoice(employerId: string, dto: GenerateInvoiceDto, actorId: string) {
    const employer = await this.findVerifiedEmployerOrThrow(employerId);

    const existing = await this.prisma.employerBillingCycle.findUnique({
      where: { employerId_billingMonth: { employerId, billingMonth: dto.billingMonth } },
    });
    if (existing) throw new ConflictException(`Invoice for ${dto.billingMonth} already exists`);

    const activeMembers = await this.prisma.employerMembership.findMany({
      where: { employerId, status: 'Active' },
      include: { patient: { include: { userProfile: { select: { fullName: true } } } } },
    });
    if (activeMembers.length === 0) throw new BadRequestException('No active members to bill');

    const subtotal    = activeMembers.reduce((sum, m) => sum + Number(m.contributionAmount), 0);
    const platformFee = activeMembers.length * Number(employer.platformFeePerSeat);
    const totalAmount = subtotal + platformFee;

    const dueDays = dto.dueDays ?? 7;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);

    const slug = employer.name.slice(0, 4).toUpperCase().replace(/\s/g, '');
    const invoiceNumber = `INV-${dto.billingMonth}-${slug}-${Date.now().toString().slice(-5)}`;

    const paymentMethod = dto.paymentMethod ?? 'Manual';

    const cycle = await this.prisma.$transaction(async (tx) => {
      const created = await tx.employerBillingCycle.create({
        data: {
          employerId,
          billingMonth: dto.billingMonth,
          invoiceNumber,
          dueDate,
          employeeCount: activeMembers.length,
          subtotal,
          platformFee,
          totalAmount,
          paymentMethod: paymentMethod as any,
          status: 'Invoiced',
          invoicedAt: new Date(),
        },
      });

      await tx.employerBillingLineItem.createMany({
        data: activeMembers.map(m => ({
          billingCycleId: created.id,
          membershipId: m.id,
          patientId: m.patientId,
          employeeName: m.patient.userProfile.fullName,
          employeeRef: m.employeeRef,
          contributionAmount: m.contributionAmount,
        })),
      });

      return created;
    });

    if (paymentMethod === 'PaymentLink') {
      await this.generatePaymentLink(cycle.id, employer.name, totalAmount);
    }

    if (employer.contactUserProfileId) {
      const contact = await this.prisma.userProfile.findUnique({ where: { id: employer.contactUserProfileId } });
      if (contact?.email) {
        await this.novu.sendInvoiceGenerated({
          subscriberId: contact.id, email: contact.email,
          firstName: contact.fullName?.split(' ')[0] ?? 'there',
          invoiceNumber, totalAmount, dueDate: dueDate.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' }),
        });
      }
    }

    return this.prisma.employerBillingCycle.findUnique({
      where: { id: cycle.id },
      include: { lineItems: true },
    });
  }

  // Called right after invoice creation — a Golink API call, so it runs
  // outside the DB transaction above (same pattern as patient top-up).
  private async generatePaymentLink(cycleId: string, employerName: string, totalAmount: number) {
    const idempotencyKey = `employer-invoice-${cycleId}`;
    try {
      const result = await this.golink.createPaymentLink({
        idempotencyKey,
        rail: 'CPAY',
        amountMinor: Math.round(totalAmount * 100),
        currency: 'LSL',
        payerName: employerName,
        description: `IthembaHealth employer invoice — ${cycleId}`,
        sourceReference: cycleId,
      });

      await this.prisma.employerBillingCycle.update({
        where: { id: cycleId },
        data: {
          golinkPaymentLink: result.checkoutUrl,
          golinkTransactionId: result.id,
          status: 'AwaitingPayment',
        },
      });
    } catch (err) {
      this.logger.error(`Failed to generate Golink payment link for billing cycle ${cycleId}`, err);
    }
  }

  async listBillingCycles(employerId: string) {
    await this.findEmployerOrThrow(employerId);
    return this.prisma.employerBillingCycle.findMany({
      where: { employerId },
      orderBy: { billingMonth: 'desc' },
      include: { _count: { select: { lineItems: true } } },
    });
  }

  async getBillingCycle(employerId: string, cycleId: string) {
    await this.findEmployerOrThrow(employerId);
    const cycle = await this.prisma.employerBillingCycle.findFirst({
      where: { id: cycleId, employerId },
      include: { lineItems: true },
    });
    if (!cycle) throw new NotFoundException('Billing cycle not found');
    return cycle;
  }

  // Admin manually confirms payment received (EFT / bank transfer)
  async confirmPayment(employerId: string, cycleId: string, dto: ConfirmPaymentDto, adminId: string) {
    const cycle = await this.prisma.employerBillingCycle.findFirst({
      where: { id: cycleId, employerId },
      include: {
        lineItems: {
          include: {
            membership: {
              include: { patient: { include: { savingsAccount: true } } },
            },
          },
        },
        employer: { include: { contactUser: true } },
      },
    });
    if (!cycle) throw new NotFoundException('Billing cycle not found');
    if (cycle.status === 'Paid') throw new BadRequestException('Billing cycle is already paid');

    const result = await this.prisma.$transaction(async (tx) => {
      for (const line of cycle.lineItems) {
        const hsa = line.membership.patient.savingsAccount;
        if (!hsa) continue;

        await tx.savingsTransaction.create({
          data: {
            accountId: hsa.id,
            patientId: line.patientId,
            transactionType: 'EmployerContribution',
            amount: line.contributionAmount,
            notes: `Employer contribution — ${cycle.invoiceNumber} (${cycle.billingMonth})`,
            isSuccessful: true,
          },
        });

        await tx.healthSavingsAccount.update({
          where: { id: hsa.id },
          data: {
            balance:          { increment: line.contributionAmount },
            totalContributed: { increment: line.contributionAmount },
          },
        });

        await tx.employerBillingLineItem.update({
          where: { id: line.id },
          data: { hsaCredited: true, hsaCreditedAt: new Date() },
        });
      }

      return tx.employerBillingCycle.update({
        where: { id: cycleId },
        data: { status: 'Paid', paidAt: new Date(), confirmedBy: adminId, notes: dto.notes },
      });
    });

    if (cycle.employer.contactUser?.email) {
      const contact = cycle.employer.contactUser;
      await this.novu.sendInvoicePaid({
        subscriberId: contact.id, email: contact.email,
        firstName: contact.fullName?.split(' ')[0] ?? 'there',
        invoiceNumber: cycle.invoiceNumber, totalAmount: Number(cycle.totalAmount),
      });
    }

    return result;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async findEmployerOrThrow(id: string) {
    const employer = await this.prisma.employer.findUnique({ where: { id } });
    if (!employer) throw new NotFoundException('Employer not found');
    return employer;
  }

  private async findVerifiedEmployerOrThrow(id: string) {
    const employer = await this.findEmployerOrThrow(id);
    if (!employer.isVerified) throw new BadRequestException('Employer account is not yet verified');
    return employer;
  }

  private async findMembershipOrThrow(employerId: string, membershipId: string) {
    const m = await this.prisma.employerMembership.findFirst({
      where: { id: membershipId, employerId },
    });
    if (!m) throw new NotFoundException('Membership not found');
    return m;
  }
}
