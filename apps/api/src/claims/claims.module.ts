import { Module } from '@nestjs/common';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';
import { NovuModule } from '../novu/novu.module';
import { GolinkModule } from '../golink/golink.module';

@Module({
  imports: [NovuModule, GolinkModule],
  controllers: [ClaimsController],
  providers: [ClaimsService],
  exports: [ClaimsService],
})
export class ClaimsModule {}
