import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Wso2JwtStrategy } from './wso2-jwt.strategy';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'wso2-jwt' })],
  controllers: [AuthController],
  providers: [AuthService, Wso2JwtStrategy, RolesGuard],
  exports: [AuthService, RolesGuard, PassportModule],
})
export class AuthModule {}
