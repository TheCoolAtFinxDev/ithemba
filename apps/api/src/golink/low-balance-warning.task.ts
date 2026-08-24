import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NovuService } from '../novu/novu.service';

const LOW_BALANCE_FRACTION = 0.2; // threshold = 20% of the patient's auto-debit amount
const RENOTIFY_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class LowBalanceWarningTask {
  private readonly logger = new Logger(LowBalanceWarningTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly novu: NovuService,
  ) {}

  // Threshold is relative to the patient's own configured auto-debit amount —
  // patients without auto-debit set up have no reliable contribution baseline
  // to be "relative to", so they're skipped rather than guessed at.
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkLowBalances() {
    const candidates = await this.prisma.healthSavingsAccount.findMany({
      where: {
        autoDebitEnabled: true,
        autoDebitSetup: { isActive: true },
      },
      include: {
        autoDebitSetup: true,
        patient: { include: { userProfile: true } },
      },
    });

    const now = Date.now();
    for (const account of candidates) {
      const setup = account.autoDebitSetup;
      const profile = account.patient?.userProfile;
      if (!setup || !profile) continue;

      const threshold = Number(setup.amount) * LOW_BALANCE_FRACTION;
      const balance = Number(account.balance);
      if (balance >= threshold) continue;

      if (account.lastLowBalanceNotifiedAt && now - account.lastLowBalanceNotifiedAt.getTime() < RENOTIFY_AFTER_MS) {
        continue;
      }

      try {
        await this.novu.sendLowBalanceWarning({
          subscriberId: profile.id, email: profile.email,
          firstName: profile.fullName?.split(' ')[0] ?? 'there',
          balance, threshold,
        });
        await this.prisma.healthSavingsAccount.update({
          where: { id: account.id },
          data: { lastLowBalanceNotifiedAt: new Date() },
        });
      } catch (err) {
        this.logger.error(`Low balance warning failed for account ${account.id}`, err);
      }
    }
  }
}
