import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AnnualFeeTask } from './annual-fee.task';
import { RolesGuard } from '../auth/roles.guard';
import { Wso2Module } from '../wso2/wso2.module';
import { NovuModule } from '../novu/novu.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [Wso2Module, NovuModule, AuthModule],
  controllers: [AdminController],
  providers: [AdminService, RolesGuard, AnnualFeeTask],
  exports: [AdminService],
})
export class AdminModule {}
