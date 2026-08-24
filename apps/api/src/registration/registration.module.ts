import { Module } from '@nestjs/common';
import { RegistrationController } from './registration.controller';
import { RegistrationService } from './registration.service';
import { Wso2Module } from '../wso2/wso2.module';
import { NovuModule } from '../novu/novu.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [Wso2Module, NovuModule, AuthModule],
  controllers: [RegistrationController],
  providers: [RegistrationService],
})
export class RegistrationModule {}
