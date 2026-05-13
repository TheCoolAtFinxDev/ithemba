import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitClaimDto, ReviewClaimDto } from './claims.dto';

const CLAIM_FEE_PERCENT = 0.05;

function claimNumber(): string {
  return `CLM-${Date.now().toString(36).toUpperCase()}`;
}

@Injectable()
export class ClaimsService {
  constructor(private prisma: PrismaService) {}

  // ── Provider submits claim ───────────────────────────────────

  async submitClaim(userProfileId: string, providerId: string, dto: SubmitClaimDto) {
    const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) throw new NotFoundException('Provider not found');
    if (provider.userProfileId !== userProfileId) throw new ForbiddenException();

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: { patient: { include: { savingsAccount: true } } },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.providerId !== providerId) throw new ForbiddenException();
    if (appointment.status !== 'Completed') {
      throw new BadRequestException('Claims can only be submitted for completed appointments');
    }

    const existing = await this.prisma.providerClaim.findFirst({
      where: { appointmentId: dto.appointmentId },
    });
    if (existing) throw new BadRequestException('A claim already exists for this appointment');

    const account = appointment.patient?.savingsAccount;
    if (!account) throw new BadRequestException('Patient wallet not found');

    return this.prisma.providerClaim.create({
      data: {
        claimNumber: claimNumber(),
        accountId: account.id,
        providerId,
        appointmentId: dto.appointmentId,
        dateOfVisit: dto.dateOfVisit ? new Date(dto.dateOfVisit) : appointment.startUtc,
        totalAmount: dto.totalAmount,
        description: dto.description,
        status: 'Submitted',
        createdBy: userProfileId,
      },
    });
  }

  // ── Provider views their claims ──────────────────────────────

  async getProviderClaims(userProfileId: string, providerId: string) {
    const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) throw new NotFoundException('Provider not found');
    if (provider.userProfileId !== userProfileId) throw new ForbiddenException();

    return this.prisma.providerClaim.findMany({
      where: { providerId },
      include: {
        appointment: {
          select: { startUtc: true, status: true },
        },
        account: {
          select: { patient: { select: { userProfile: { select: { fullName: true } } } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Patient views claims against their account ───────────────

  async getPatientClaims(userProfileId: string, patientId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Patient not found');
    if (patient.userProfileId !== userProfileId) throw new ForbiddenException();

    const account = await this.prisma.healthSavingsAccount.findUnique({
      where: { patientId: patient.id },
    });
    if (!account) return [];

    return this.prisma.providerClaim.findMany({
      where: { accountId: account.id },
      include: {
        provider: { select: { firstName: true, lastName: true, clinicName: true } },
        appointment: { select: { startUtc: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Admin: list all claims ───────────────────────────────────

  async adminListClaims(status?: string) {
    return this.prisma.providerClaim.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        provider: { select: { firstName: true, lastName: true, clinicName: true } },
        account: {
          select: { patient: { select: { userProfile: { select: { fullName: true, email: true } } } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Admin: approve claim ─────────────────────────────────────

  async approveClaim(adminUserId: string, claimId: string, dto: ReviewClaimDto) {
    const claim = await this.prisma.providerClaim.findUnique({
      where: { id: claimId },
      include: { account: true },
    });
    if (!claim) throw new NotFoundException('Claim not found');
    if (!['Submitted', 'InReview'].includes(claim.status)) {
      throw new BadRequestException('Claim cannot be approved in its current status');
    }

    const fee = Number(claim.totalAmount) * CLAIM_FEE_PERCENT;
    const net = Number(claim.totalAmount) + fee;

    if (Number(claim.account.balance) < net) {
      throw new BadRequestException('Insufficient wallet balance to approve this claim');
    }

    return this.prisma.$transaction(async (tx) => {
      const txRecord = await tx.savingsTransaction.create({
        data: {
          accountId: claim.accountId,
          patientId: claim.account.patientId,
          transactionType: 'ClaimPayment',
          amount: net,
          notes: `Claim ${claim.claimNumber} — ${fee.toFixed(2)} service fee`,
          isSuccessful: true,
        },
      });

      await tx.healthSavingsAccount.update({
        where: { id: claim.accountId },
        data: {
          balance: { decrement: net },
          totalClaimed: { increment: net },
        },
      });

      return tx.providerClaim.update({
        where: { id: claimId },
        data: {
          status: 'Approved',
          linkedTransactionId: txRecord.id,
          decisionTimestamp: new Date(),
          approvedBy: adminUserId,
          lastModifiedBy: adminUserId,
        },
      });
    });
  }

  // ── Admin: reject claim ──────────────────────────────────────

  async rejectClaim(adminUserId: string, claimId: string, dto: ReviewClaimDto) {
    const claim = await this.prisma.providerClaim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundException('Claim not found');
    if (!['Submitted', 'InReview'].includes(claim.status)) {
      throw new BadRequestException('Claim cannot be rejected in its current status');
    }

    return this.prisma.providerClaim.update({
      where: { id: claimId },
      data: {
        status: 'Rejected',
        decisionTimestamp: new Date(),
        approvedBy: adminUserId,
        lastModifiedBy: adminUserId,
      },
    });
  }
}
