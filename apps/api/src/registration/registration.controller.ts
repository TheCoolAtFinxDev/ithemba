import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RegistrationService } from './registration.service';
import { InitiateRegistrationDto, VerifyRegistrationDto } from './registration.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('registration')
@Controller('auth/register')
export class RegistrationController {
  constructor(private readonly service: RegistrationService) {}

  @Post()
  @ApiOperation({ summary: 'Initiate self-registration — sends email + SMS OTP' })
  initiate(@Body() dto: InitiateRegistrationDto) {
    return this.service.initiate(dto);
  }

  @Get('invite/:token')
  @ApiOperation({ summary: 'Look up an employer invite for registration prefill' })
  getInvite(@Param('token') token: string) {
    return this.service.getEmployerInvite(token);
  }

  // OTP is a 6-digit code — tightly rate-limited so it can't be brute-forced
  // within its 1-hour expiry window (500,000 possibilities / 5 attempts per
  // minute makes brute force impractical).
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post(':pendingId/verify')
  @ApiOperation({ summary: 'Verify email + SMS OTP and create account' })
  verify(@Param('pendingId') pendingId: string, @Body() dto: VerifyRegistrationDto) {
    return this.service.verify(pendingId, dto);
  }

  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post(':pendingId/resend')
  @ApiOperation({ summary: 'Resend OTP codes' })
  resend(@Param('pendingId') pendingId: string) {
    return this.service.resend(pendingId);
  }

  // ── Admin support ────────────────────────────────────────────

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list pending registrations stuck awaiting OTP' })
  listPending() {
    return this.service.listPending();
  }

  @Post(':pendingId/admin-verify-phone')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: force-verify a stuck phone OTP so the user can complete registration' })
  adminVerifyPhone(@CurrentUser() user: any, @Param('pendingId') pendingId: string) {
    return this.service.adminVerifyPhone(user.sub, pendingId);
  }
}
