import { Controller, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NovuService } from '../novu/novu.service';
import { Logger } from '@nestjs/common';

// Golink calls this directly — not behind JwtAuthGuard. Authenticity comes
// from the HMAC signature, not a bearer token. Exempt from the global
// throttler too — webhook retries are event-driven, not user-driven, and
// dropping a legitimate payment confirmation would be worse than any abuse risk.
@SkipThrottle()
@ApiExcludeController()
@Controller('webhooks')
export class GolinkWebhookController {
  private readonly logger = new Logger(GolinkWebhookController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly novu: NovuService,
  ) {}

  @Post('golink')
  async handle(@Req() req: Request, @Res() res: Response) {
    const secret = this.config.get<string>('GOLINK_WEBHOOK_SECRET', '');
    const signature = req.headers['x-golink-signature'] as string | undefined;
    const rawBody: Buffer = req.body;

    if (!secret || !signature || !this.verifySignature(rawBody, signature, secret)) {
      this.logger.warn('Rejected Golink webhook — missing or invalid signature');
      throw new UnauthorizedException('Invalid signature');
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    await this.processEvent(event);

    res.status(200).send({ received: true });
  }

  private verifySignature(rawBody: Buffer, signatureHeader: string, secret: string): boolean {
    const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signatureHeader);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private async processEvent(event: { type: string; data?: { id?: string; failureReason?: string } }) {
    const paymentId = event?.data?.id;
    if (!paymentId) return;

    if (event.type === 'payment.succeeded') {
      await this.markSucceeded(paymentId);
    } else if (event.type === 'payment.failed') {
      await this.markFailed(paymentId, event.data?.failureReason);
    } else if (event.type === 'disbursement.succeeded') {
      await this.markDisbursementSucceeded(paymentId);
    } else if (event.type === 'disbursement.failed') {
      await this.markDisbursementFailed(paymentId, event.data?.failureReason);
    }
    // payment.refunded intentionally not handled yet — refunds are out of scope for this phase.
  }

  private async markDisbursementSucceeded(golinkPaymentId: string) {
    const payout = await this.prisma.paymentPayout.findFirst({ where: { reference: golinkPaymentId } });
    if (!payout || payout.status !== 'Processing') return; // already settled or unknown — idempotent no-op

    await this.prisma.$transaction([
      this.prisma.paymentPayout.update({
        where: { id: payout.id },
        data: { status: 'Completed', processedAt: new Date() },
      }),
      ...(payout.claimId
        ? [this.prisma.providerClaim.update({ where: { id: payout.claimId }, data: { status: 'Paid' } })]
        : []),
    ]);
    this.logger.log(`Disbursement ${golinkPaymentId} succeeded — payout ${payout.id} marked Completed`);

    const provider = await this.prisma.provider.findUnique({ where: { id: payout.providerId } });
    if (provider?.email) {
      await this.novu.sendProviderDisbursementSucceeded({
        subscriberId: provider.userProfileId, email: provider.email,
        firstName: provider.firstName, amount: Number(payout.amount),
        claimNumber: payout.claimId ?? payout.id,
      });
    }
  }

  private async markDisbursementFailed(golinkPaymentId: string, failureReason?: string) {
    const payout = await this.prisma.paymentPayout.findFirst({ where: { reference: golinkPaymentId } });
    if (!payout || payout.status !== 'Processing') return;

    await this.prisma.paymentPayout.update({
      where: { id: payout.id },
      data: { status: 'Failed', failureReason: failureReason ?? 'Disbursement failed' },
    });
    this.logger.log(`Disbursement ${golinkPaymentId} failed: ${failureReason ?? 'unknown reason'}`);

    const provider = await this.prisma.provider.findUnique({ where: { id: payout.providerId } });
    const reason = failureReason ?? 'Disbursement failed';
    if (provider?.email) {
      await this.novu.sendProviderDisbursementFailed({
        subscriberId: provider.userProfileId, email: provider.email,
        firstName: provider.firstName, amount: Number(payout.amount),
        claimNumber: payout.claimId ?? payout.id, reason,
      });
    }
    await this.novu.notifyAdminsDisbursementFailed({
      providerName: provider ? `${provider.firstName} ${provider.lastName ?? ''}`.trim() : payout.providerId,
      amount: Number(payout.amount), reason,
    });
  }

  private async markSucceeded(golinkPaymentId: string) {
    const txn = await this.prisma.savingsTransaction.findUnique({
      where: { golinkPaymentId },
      include: { account: { include: { patient: { include: { userProfile: true } } } } },
    });
    if (txn) {
      if (txn.status !== 'Processing') return; // already settled — idempotent no-op
      await this.prisma.$transaction([
        this.prisma.savingsTransaction.update({
          where: { id: txn.id },
          data: { status: 'Succeeded', isSuccessful: true },
        }),
        this.prisma.healthSavingsAccount.update({
          where: { id: txn.accountId },
          data: {
            balance: { increment: txn.amount },
            totalContributed: { increment: txn.amount },
          },
        }),
      ]);
      this.logger.log(`Top-up ${golinkPaymentId} succeeded — credited ${txn.amount} to account ${txn.accountId}`);

      const profile = txn.account.patient?.userProfile;
      if (profile) {
        await this.novu.sendTopupSucceeded({
          subscriberId: profile.id, email: profile.email,
          firstName: profile.fullName?.split(' ')[0] ?? 'there',
          amount: Number(txn.amount), newBalance: Number(txn.account.balance) + Number(txn.amount),
        });
      }
      return;
    }

    await this.markEmployerInvoicePaid(golinkPaymentId);
  }

  private async markFailed(golinkPaymentId: string, failureReason?: string) {
    const txn = await this.prisma.savingsTransaction.findUnique({
      where: { golinkPaymentId },
      include: { account: { include: { patient: { include: { userProfile: true } } } } },
    });
    if (txn) {
      if (txn.status !== 'Processing') return;
      await this.prisma.savingsTransaction.update({
        where: { id: txn.id },
        data: { status: 'Failed', isSuccessful: false, failureReason: failureReason ?? 'Payment failed' },
      });
      const reason = failureReason ?? 'Payment failed';
      this.logger.log(`Top-up ${golinkPaymentId} failed: ${reason}`);

      const profile = txn.account.patient?.userProfile;
      if (profile) {
        await this.novu.sendTopupFailed({
          subscriberId: profile.id, email: profile.email,
          firstName: profile.fullName?.split(' ')[0] ?? 'there',
          amount: Number(txn.amount), reason,
        });
      }
      await this.novu.notifyAdminsPaymentFailed({
        patientName: profile?.fullName ?? 'Unknown patient', amount: Number(txn.amount), reason,
      });
      return;
    }

    const cycle = await this.prisma.employerBillingCycle.findUnique({ where: { golinkTransactionId: golinkPaymentId } });
    if (!cycle || cycle.status !== 'AwaitingPayment') return;
    await this.prisma.employerBillingCycle.update({ where: { id: cycle.id }, data: { status: 'Failed' } });
    this.logger.log(`Employer invoice payment ${golinkPaymentId} failed: ${failureReason ?? 'unknown reason'}`);
  }

  // Employer invoice paid via hosted payment link — credit every member's
  // HSA, same crediting logic as the admin manual-confirm path in
  // employer.service.ts (kept inline here to avoid a circular module
  // dependency between GolinkModule and EmployerModule).
  private async markEmployerInvoicePaid(golinkPaymentId: string) {
    const cycle = await this.prisma.employerBillingCycle.findUnique({
      where: { golinkTransactionId: golinkPaymentId },
      include: {
        lineItems: { include: { membership: { include: { patient: { include: { savingsAccount: true } } } } } },
        employer: { include: { contactUser: true } },
      },
    });
    if (!cycle || cycle.status !== 'AwaitingPayment') return; // unknown or already settled — idempotent no-op

    await this.prisma.$transaction(async (tx) => {
      for (const line of cycle.lineItems) {
        const hsa = line.membership.patient.savingsAccount;
        if (!hsa || line.hsaCredited) continue;

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
            balance: { increment: line.contributionAmount },
            totalContributed: { increment: line.contributionAmount },
          },
        });

        await tx.employerBillingLineItem.update({
          where: { id: line.id },
          data: { hsaCredited: true, hsaCreditedAt: new Date() },
        });
      }

      await tx.employerBillingCycle.update({
        where: { id: cycle.id },
        data: { status: 'Paid', paidAt: new Date() },
      });
    });

    this.logger.log(`Employer invoice ${cycle.invoiceNumber} paid via Golink — ${cycle.lineItems.length} member(s) credited`);

    const contact = cycle.employer.contactUser;
    if (contact) {
      await this.novu.sendInvoicePaid({
        subscriberId: contact.id, email: contact.email,
        firstName: contact.fullName?.split(' ')[0] ?? 'there',
        invoiceNumber: cycle.invoiceNumber, totalAmount: Number(cycle.totalAmount),
      });
    }
  }
}
