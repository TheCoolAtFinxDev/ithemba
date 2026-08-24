import { Module } from '@nestjs/common';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { GolinkModule } from '../golink/golink.module';
import { NovuModule } from '../novu/novu.module';

@Module({
  imports: [GolinkModule, NovuModule],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
