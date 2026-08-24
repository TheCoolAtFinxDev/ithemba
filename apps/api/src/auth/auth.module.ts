import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { Wso2JwtStrategy } from './wso2-jwt.strategy';
import { RolesGuard } from './roles.guard';
import { PermissionsGuard } from './permissions.guard';
import { NovuModule } from '../novu/novu.module';
import { Wso2Module } from '../wso2/wso2.module';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'wso2-jwt' }), NovuModule, Wso2Module],
  controllers: [AuthController],
  providers: [AuthService, PasswordResetService, Wso2JwtStrategy, RolesGuard, PermissionsGuard],
  exports: [AuthService, RolesGuard, PermissionsGuard, PassportModule],
})
export class AuthModule {}