import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GolinkService } from './golink.service';
import { GolinkWebhookController } from './golink.controller';
import { AutoDebitChargeTask } from './auto-debit-charge.task';
import { LowBalanceWarningTask } from './low-balance-warning.task';
import { NovuModule } from '../novu/novu.module';

@Module({
  imports: [HttpModule, NovuModule],
  controllers: [GolinkWebhookController],
  providers: [GolinkService, AutoDebitChargeTask, LowBalanceWarningTask],
  exports: [GolinkService],
})
export class GolinkModule {}
