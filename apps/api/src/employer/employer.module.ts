import { Module } from '@nestjs/common';
import { EmployerController } from './employer.controller';
import { EmployerService } from './employer.service';
import { RolesGuard } from '../auth/roles.guard';
import { Wso2Module } from '../wso2/wso2.module';
import { NovuModule } from '../novu/novu.module';
import { AuthModule } from '../auth/auth.module';
import { GolinkModule } from '../golink/golink.module';

@Module({
  imports: [Wso2Module, NovuModule, AuthModule, GolinkModule],
  controllers: [EmployerController],
  providers: [EmployerService, RolesGuard],
  exports: [EmployerService],
})
export class EmployerModule {}
