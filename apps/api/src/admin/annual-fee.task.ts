import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { readSetting } from '../common/settings.helper';

@Injectable()
export class AnnualFeeTask {
  private readonly logger = new Logger(AnnualFeeTask.name);

  constructor(private readonly prisma: PrismaService) {}

  // Runs once a day; only acts during January, and only once per account per
  // year — dedup via the same "check transaction notes" pattern used for the
  // once-off registration fee in patients.service.ts.
  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async chargeAnnualFee() {
    const now = new Date();
    if (now.getUTCMonth() !== 0) return; // January only

    const year = now.getUTCFullYear();
    const note = `Annual admin fee (${year})`;
    const fee = await readSetting(this.prisma, 'annualAdminFee', 67);

    const accounts = await this.prisma.healthSavingsAccount.findMany({
      where: { transactions: { none: { notes: note } } },
    });

    if (accounts.length === 0) return;
    this.logger.log(`Charging annual admin fee (${fee}) to ${accounts.length} account(s) for ${year}`);

    for (const account of accounts) {
      try {
        await this.prisma.$transaction([
          this.prisma.savingsTransaction.create({
            data: {
              accountId: account.id,
              patientId: account.patientId,
              transactionType: 'Debit',
              amount: fee,
              notes: note,
              isSuccessful: true,
            },
          }),
          // Balance is allowed to go negative — same as the once-off registration
          // fee, which debits before the patient has necessarily topped up.
          this.prisma.healthSavingsAccount.update({
            where: { id: account.id },
            data: { balance: { decrement: fee } },
          }),
        ]);
      } catch (err) {
        this.logger.error(`Annual fee charge failed for account ${account.id}`, err);
      }
    }

    this.logger.log(`Annual admin fee run complete for ${year}`);
  }
}
