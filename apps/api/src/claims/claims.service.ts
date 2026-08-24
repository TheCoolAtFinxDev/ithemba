import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NovuService } from '../novu/novu.service';
import { GolinkService } from '../golink/golink.service';
import { SubmitClaimDto, EditClaimDto, ReviewClaimDto } from './claims.dto';
import { readSetting } from '../common/settings.helper';

const CLAIM_FEE_PERCENT_DEFAULT = 0.05;

function claimNumber(): string {
  return `CLM-${Date.now().toString(36).toUpperCase()}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * The 5% service fee only applies to the portion the HSA actually pays out —
 * so the most a balance can cover is balance / 1.05. Anything above that is
 * the patient's out-of-pocket responsibility, settled directly with the provider.
 */
function splitClaim(totalAmount: number, balance: number, feePercent = CLAIM_FEE_PERCENT_DEFAULT) {
  const maxHsaCoverable = Math.max(0, balance / (1 + feePercent));
  const hsaCoveredAmount = round2(Math.min(totalAmount, maxHsaCoverable));
  const outOfPocketAmount = round2(totalAmount - hsaCoveredAmount);
  const fee = round2(hsaCoveredAmount * feePercent);
  const net = round2(hsaCoveredAmount + fee);
  return { hsaCoveredAmount, outOfPocketAmount, fee, net };
}

@Injectable()
export class ClaimsService {
  constructor(private prisma: PrismaService, private novu: NovuService, private golink: GolinkService) {}

  // ── Provider submits claim ───────────────────────────────────

  async submitClaim(userProfileId: string, providerId: string, dto: SubmitClaimDto) {
    const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) throw new NotFoundException('Provider not found');
    if (provider.userProfileId !== userProfileId) throw new ForbiddenException();

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: { patient: { include: { savingsAccount: true, userProfile: { select: { fullName: true } } } } },
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

    // Estimate at submission time so the provider/patient see the split immediately.
    // The authoritative split is recomputed at approval time against the live balance.
    const feePercent = (await readSetting(this.prisma, 'transactionFeePercent', 5)) / 100;
    const { hsaCoveredAmount, outOfPocketAmount } = splitClaim(dto.totalAmount, Number(account.balance), feePercent);

    const claim = await this.prisma.providerClaim.create({
      data: {
        claimNumber: claimNumber(),
        accountId: account.id,
        providerId,
        appointmentId: dto.appointmentId,
        dateOfVisit: dto.dateOfVisit ? new Date(dto.dateOfVisit) : appointment.startUtc,
        totalAmount: dto.totalAmount,
        hsaCoveredAmount,
        outOfPocketAmount,
        description: dto.description,
        status: 'Submitted',
        createdBy: userProfileId,
        lineItems: dto.lineItems?.length
          ? { create: dto.lineItems.map(li => ({
              description: li.description,
              quantity: li.quantity ?? 1,
              unitPrice: li.unitPrice,
            })) }
          : undefined,
      },
      include: { lineItems: true },
    });

    await this.novu.notifyAdminsNewClaim({
      providerName: `${provider.firstName} ${provider.lastName ?? ''}`.trim(),
      patientName: appointment.patient?.userProfile?.fullName ?? 'Unknown patient',
      amount: dto.totalAmount,
    });

    return claim;
  }

  // ── Provider edits/withdraws a claim before review ────────────

  async editClaim(userProfileId: string, providerId: string, claimId: string, dto: EditClaimDto) {
    const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) throw new NotFoundException('Provider not found');
    if (provider.userProfileId !== userProfileId) throw new ForbiddenException();

    const claim = await this.prisma.providerClaim.findFirst({
      where: { id: claimId, providerId },
      include: { account: true },
    });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.status !== 'Submitted') {
      throw new BadRequestException('Only claims awaiting review can be edited');
    }

    const feePercent = (await readSetting(this.prisma, 'transactionFeePercent', 5)) / 100;
    const { hsaCoveredAmount, outOfPocketAmount } = splitClaim(dto.totalAmount, Number(claim.account.balance), feePercent);

    return this.prisma.$transaction(async (tx) => {
      // Full replace — the edit form resubmits the whole line-item list each
      // time, same semantics as the working-hours/time-off editors elsewhere.
      if (dto.lineItems) {
        await tx.claimLineItem.deleteMany({ where: { claimId } });
      }

      return tx.providerClaim.update({
        where: { id: claimId },
        data: {
          totalAmount: dto.totalAmount,
          hsaCoveredAmount,
          outOfPocketAmount,
          description: dto.description,
          dateOfVisit: dto.dateOfVisit ? new Date(dto.dateOfVisit) : claim.dateOfVisit,
          lastModifiedBy: userProfileId,
          lineItems: dto.lineItems?.length
            ? { create: dto.lineItems.map(li => ({
                description: li.description,
                quantity: li.quantity ?? 1,
                unitPrice: li.unitPrice,
              })) }
            : undefined,
        },
        include: { lineItems: true },
      });
    });
  }

  async withdrawClaim(userProfileId: string, providerId: string, claimId: string) {
    const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) throw new NotFoundException('Provider not found');
    if (provider.userProfileId !== userProfileId) throw new ForbiddenException();

    const claim = await this.prisma.providerClaim.findFirst({ where: { id: claimId, providerId } });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.status !== 'Submitted') {
      throw new BadRequestException('Only claims awaiting review can be withdrawn');
    }

    return this.prisma.providerClaim.update({
      where: { id: claimId },
      data: { status: 'Withdrawn', lastModifiedBy: userProfileId, decisionTimestamp: new Date() },
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
          select: { balance: true, patient: { select: { userProfile: { select: { fullName: true } } } } },
        },
        lineItems: true,
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
        lineItems: true,
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
          select: {
            balance: true,
            patient: { select: { userProfile: { select: { fullName: true, email: true } } } },
          },
        },
        lineItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Admin: export claims as CSV ───────────────────────────────

  async exportClaimsCsv(status?: string, from?: string, to?: string): Promise<string> {
    const claims = await this.prisma.providerClaim.findMany({
      where: {
        status: status ? (status as any) : undefined,
        createdAt: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
      },
      include: {
        provider: { select: { firstName: true, lastName: true, clinicName: true } },
        account: {
          select: { patient: { select: { userProfile: { select: { fullName: true, email: true } } } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Claim Number', 'Status', 'Provider', 'Clinic', 'Patient', 'Patient Email',
      'Date of Visit', 'Total Amount', 'HSA Covered', 'Out of Pocket', 'Submitted At',
    ];
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = claims.map(c => [
      c.claimNumber, c.status,
      `${c.provider.firstName} ${c.provider.lastName}`, c.provider.clinicName,
      c.account.patient?.userProfile?.fullName ?? '', c.account.patient?.userProfile?.email ?? '',
      c.dateOfVisit.toISOString().slice(0, 10),
      Number(c.totalAmount).toFixed(2), Number(c.hsaCoveredAmount).toFixed(2), Number(c.outOfPocketAmount).toFixed(2),
      c.createdAt.toISOString(),
    ].map(escape).join(','));

    return [headers.map(escape).join(','), ...rows].join('\n');
  }

  // ── Admin: approve claim ─────────────────────────────────────

  async approveClaim(adminUserId: string, claimId: string, dto: ReviewClaimDto) {
    const claim = await this.prisma.providerClaim.findUnique({
      where: { id: claimId },
      include: {
        account: true,
        provider: {
          select: {
            id: true, userProfileId: true, firstName: true, lastName: true, email: true, disbursementEnabled: true,
            ecocashNumber: true, bankAccountNumber: true, bankName: true, isVerified: true,
          },
        },
      },
    });
    if (!claim) throw new NotFoundException('Claim not found');
    if (!['Submitted', 'InReview'].includes(claim.status)) {
      throw new BadRequestException('Claim cannot be approved in its current status');
    }

    const hasPayoutDetails = !!(claim.provider.ecocashNumber || (claim.provider.bankAccountNumber && claim.provider.bankName));
    if (claim.provider.disbursementEnabled && (!claim.provider.isVerified || !hasPayoutDetails)) {
      throw new BadRequestException('Provider has disbursement enabled but is missing payout details or verification');
    }

    // Recompute against the live balance — it may have moved (top-up, other
    // claims) since the provider submitted. This is the figure of record.
    const balanceBefore = Number(claim.account.balance);
    const feePercent = (await readSetting(this.prisma, 'transactionFeePercent', 5)) / 100;
    const { hsaCoveredAmount, outOfPocketAmount, fee, net } = splitClaim(Number(claim.totalAmount), balanceBefore, feePercent);

    const result = await this.prisma.$transaction(async (tx) => {
      // Atomically claim the row — only succeeds if still Submitted/InReview.
      // Guards against a concurrent approve/reject on the same claim causing
      // a double HSA debit; the loser gets count 0 and the whole transaction
      // rolls back (including the SavingsTransaction/HSA writes below).
      const claimed = await tx.providerClaim.updateMany({
        where: { id: claimId, status: { in: ['Submitted', 'InReview'] } },
        data: { status: 'Approved' },
      });
      if (claimed.count === 0) {
        throw new ConflictException('Claim is no longer awaiting review — it may have just been decided by another action');
      }

      let linkedTransactionId: string | null = null;

      if (net > 0) {
        const txRecord = await tx.savingsTransaction.create({
          data: {
            accountId: claim.accountId,
            patientId: claim.account.patientId,
            transactionType: 'ClaimPayment',
            amount: net,
            notes: `Claim ${claim.claimNumber} — R${fee.toFixed(2)} service fee`
              + (outOfPocketAmount > 0 ? ` — R${outOfPocketAmount.toFixed(2)} paid out of pocket by patient` : ''),
            isSuccessful: true,
          },
        });
        linkedTransactionId = txRecord.id;

        await tx.healthSavingsAccount.update({
          where: { id: claim.accountId },
          data: {
            balance: { decrement: net },
            totalClaimed: { increment: net },
          },
        });
      }

      const updated = await tx.providerClaim.update({
        where: { id: claimId },
        data: {
          hsaCoveredAmount,
          outOfPocketAmount,
          linkedTransactionId,
          decisionTimestamp: new Date(),
          approvedBy: adminUserId,
          lastModifiedBy: adminUserId,
          adminNotes: dto.notes,
        },
      });

      // Recorded for dispute resolution and analytics — full breakdown of how
      // much HSA paid vs. what the patient owes out of pocket, and the balance
      // at the moment of approval.
      await tx.auditLogEntry.create({
        data: {
          userId: adminUserId,
          action: 'CLAIM_APPROVED',
          entity: 'ProviderClaim',
          entityId: claimId,
          newValues: {
            claimNumber: claim.claimNumber,
            totalAmount: Number(claim.totalAmount),
            hsaCoveredAmount,
            outOfPocketAmount,
            fee,
            netDebited: net,
            patientBalanceBefore: balanceBefore,
            patientBalanceAfter: round2(balanceBefore - net),
          },
        },
      });

      return updated;
    });

    if (claim.provider.disbursementEnabled && hsaCoveredAmount > 0) {
      await this.disburseToProvider(claim.provider, claimId, claim.claimNumber, hsaCoveredAmount);
    }

    await this.notifyPatientOfClaimDecision(claim, 'approve', net);

    return result;
  }

  // ── Admin: reject claim ──────────────────────────────────────

  async rejectClaim(adminUserId: string, claimId: string, dto: ReviewClaimDto) {
    const claim = await this.prisma.providerClaim.findUnique({
      where: { id: claimId },
      include: {
        account: true,
        provider: { select: { firstName: true, lastName: true } },
      },
    });
    if (!claim) throw new NotFoundException('Claim not found');
    if (!['Submitted', 'InReview'].includes(claim.status)) {
      throw new BadRequestException('Claim cannot be rejected in its current status');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Same atomic-claim guard as approveClaim — prevents a reject racing
      // an approve (or another reject) on the same claim.
      const claimed = await tx.providerClaim.updateMany({
        where: { id: claimId, status: { in: ['Submitted', 'InReview'] } },
        data: {
          status: 'Rejected',
          decisionTimestamp: new Date(),
          approvedBy: adminUserId,
          lastModifiedBy: adminUserId,
          adminNotes: dto.notes,
        },
      });
      if (claimed.count === 0) {
        throw new ConflictException('Claim is no longer awaiting review — it may have just been decided by another action');
      }

      const updated = await tx.providerClaim.findUniqueOrThrow({ where: { id: claimId } });

      await tx.auditLogEntry.create({
        data: {
          userId: adminUserId,
          action: 'CLAIM_REJECTED',
          entity: 'ProviderClaim',
          entityId: claimId,
          newValues: { claimNumber: claim.claimNumber, totalAmount: Number(claim.totalAmount), notes: dto.notes },
        },
      });

      return updated;
    });

    await this.notifyPatientOfClaimDecision(claim, 'reject', Number(claim.totalAmount), dto.notes);

    return result;
  }

  // Disburses the HSA-covered portion to the provider via Golink. Runs after
  // the ledger debit has already committed — a failure here does not undo the
  // patient's debit, it just leaves the PaymentPayout row Failed for admin
  // follow-up (same non-blocking pattern as patient top-up in patients.service.ts).
  private async disburseToProvider(
    provider: {
      id: string; userProfileId: string; firstName: string; lastName: string | null; email: string;
      ecocashNumber: string | null; bankAccountNumber: string | null; bankName: string | null;
    },
    claimId: string,
    claimNo: string,
    amount: number,
  ) {
    const idempotencyKey = `claim-payout-${claimId}`;
    const payout = await this.prisma.paymentPayout.create({
      data: {
        providerId: provider.id,
        claimId,
        amount,
        method: provider.ecocashNumber ? 'EcoCash' : 'EFT',
        idempotencyKey,
        status: 'Processing',
      },
    });

    try {
      // Provider merchant M-Pesa codes are receive-only (used to collect from
      // patients) — payouts always go out via Golink's CPAY rail regardless
      // of destination (EcoCash number or bank account).
      const result = await this.golink.createDisbursement({
        idempotencyKey,
        rail: 'CPAY',
        amountMinor: Math.round(amount * 100),
        currency: 'LSL',
        recipientName: `${provider.firstName} ${provider.lastName ?? ''}`.trim(),
        recipientPhone: provider.ecocashNumber ?? undefined,
        bankAccountNumber: provider.bankAccountNumber ?? undefined,
        bankName: provider.bankName ?? undefined,
        sourceReference: payout.id,
      });

      await this.prisma.paymentPayout.update({
        where: { id: payout.id },
        data: {
          reference: result.id,
          status: result.status === 'SUCCEEDED' ? 'Completed' : result.status === 'FAILED' ? 'Failed' : 'Processing',
          failureReason: result.failureReason,
          processedAt: result.status === 'SUCCEEDED' ? new Date() : undefined,
        },
      });

      if (result.status === 'SUCCEEDED') {
        await this.prisma.providerClaim.update({ where: { id: claimId }, data: { status: 'Paid' } });
        await this.novu.sendProviderDisbursementSucceeded({
          subscriberId: provider.userProfileId, email: provider.email,
          firstName: provider.firstName, amount, claimNumber: claimNo,
        });
      } else if (result.status === 'FAILED') {
        const reason = result.failureReason ?? 'Disbursement failed';
        await this.novu.sendProviderDisbursementFailed({
          subscriberId: provider.userProfileId, email: provider.email,
          firstName: provider.firstName, amount, claimNumber: claimNo, reason,
        });
        await this.novu.notifyAdminsDisbursementFailed({
          providerName: `${provider.firstName} ${provider.lastName ?? ''}`.trim(), amount, reason,
        });
      }
      // Otherwise still Processing — settlement notification arrives asynchronously
      // via the Golink webhook (golink.controller.ts markDisbursementSucceeded/Failed).
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Disbursement request failed';
      await this.prisma.paymentPayout.update({
        where: { id: payout.id },
        data: { status: 'Failed', failureReason: reason },
      });
      await this.novu.sendProviderDisbursementFailed({
        subscriberId: provider.userProfileId, email: provider.email,
        firstName: provider.firstName, amount, claimNumber: claimNo, reason,
      });
      await this.novu.notifyAdminsDisbursementFailed({
        providerName: `${provider.firstName} ${provider.lastName ?? ''}`.trim(), amount, reason,
      });
    }
  }

  private async notifyPatientOfClaimDecision(
    claim: { accountId: string; totalAmount: unknown; provider: { firstName: string; lastName: string | null } },
    decision: 'approve' | 'reject',
    amount: number,
    reason?: string,
  ) {
    const account = await this.prisma.healthSavingsAccount.findUnique({
      where: { id: claim.accountId },
      include: { patient: { include: { userProfile: { select: { id: true, fullName: true, email: true } } } } },
    });
    const email = account?.patient?.userProfile?.email;
    if (!email) return;

    const providerName = `Dr. ${claim.provider.firstName} ${claim.provider.lastName ?? ''}`.trim();
    const firstName = account.patient.userProfile!.fullName?.split(' ')[0] ?? 'Patient';
    const subscriberId = account.patient.userProfile!.id;

    if (decision === 'approve') {
      await this.novu.sendClaimApproved({ subscriberId, email, firstName, claimAmount: amount, providerName });
    } else {
      await this.novu.sendClaimRejected({ subscriberId, email, firstName, claimAmount: amount, providerName, reason });
    }
  }
}
