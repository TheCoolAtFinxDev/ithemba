import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { GolinkService } from './golink.service';
import { NovuService } from '../novu/novu.service';

@Injectable()
export class AutoDebitChargeTask {
  private readonly logger = new Logger(AutoDebitChargeTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly golink: GolinkService,
    private readonly novu: NovuService,
  ) {}

  // Runs once a day — individual mandates only actually charge on their own nextDebitDate.
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async chargeDueMandates() {
    const due = await this.prisma.autoDebitSetup.findMany({
      where: { isActive: true, golinkMandateId: { not: null }, nextDebitDate: { lte: new Date() } },
      include: { account: { include: { patient: { include: { userProfile: true } } } } },
    });

    if (due.length === 0) return;
    this.logger.log(`Charging ${due.length} due auto top-up mandate(s)`);

    for (const setup of due) {
      await this.chargeOne(setup);
    }
  }

  private async chargeOne(setup: Awaited<ReturnType<typeof this.prisma.autoDebitSetup.findMany>>[number] & { account: any }) {
    const billingDate = setup.nextDebitDate.toISOString().slice(0, 10);
    // Deterministic per (mandate, billing date) — a re-run on the same day safely no-ops via Golink's idempotency guarantee.
    const idempotencyKey = `autodebit-${setup.id}-${billingDate}`;
    const amount = Number(setup.amount);

    try {
      const result = await this.golink.chargeMandate({
        idempotencyKey,
        mandateId: setup.golinkMandateId!,
        amountMinor: Math.round(amount * 100),
        currency: 'LSL',
      });

      const succeeded = result.status === 'SUCCEEDED';

      await this.prisma.$transaction(async (tx) => {
        await tx.savingsTransaction.create({
          data: {
            accountId: setup.accountId,
            patientId: setup.account.patientId,
            transactionType: 'Deposit',
            amount,
            golinkPaymentId: result.id,
            status: succeeded ? 'Succeeded' : 'Failed',
            isSuccessful: succeeded,
            failureReason: succeeded ? undefined : result.failureReason ?? 'Auto top-up charge failed',
            idempotencyKey,
            notes: `Auto top-up (${setup.frequency})`,
          },
        });

        if (succeeded) {
          await tx.healthSavingsAccount.update({
            where: { id: setup.accountId },
            data: { balance: { increment: amount }, totalContributed: { increment: amount } },
          });
        }

        const days = setup.frequency === 'Weekly' ? 7 : 30;
        await tx.autoDebitSetup.update({
          where: { id: setup.id },
          data: { nextDebitDate: new Date(setup.nextDebitDate.getTime() + days * 24 * 60 * 60 * 1000) },
        });
      });

      this.logger.log(`Auto top-up ${setup.id}: ${succeeded ? 'succeeded' : 'failed'}`);

      const profile = setup.account.patient?.userProfile;
      if (profile) {
        if (succeeded) {
          await this.novu.sendAutoDebitSucceeded({
            subscriberId: profile.id, email: profile.email,
            firstName: profile.fullName?.split(' ')[0] ?? 'there',
            amount, newBalance: Number(setup.account.balance) + amount,
          });
        } else {
          const reason = result.failureReason ?? 'Auto top-up charge failed';
          await this.novu.sendAutoDebitFailed({
            subscriberId: profile.id, email: profile.email,
            firstName: profile.fullName?.split(' ')[0] ?? 'there',
            amount, reason,
          });
          await this.novu.notifyAdminsPaymentFailed({
            patientName: profile.fullName ?? 'Unknown patient', amount, reason,
          });
        }
      }
    } catch (err) {
      this.logger.error(`Auto top-up charge failed for mandate ${setup.id}`, err);
    }
  }
}
