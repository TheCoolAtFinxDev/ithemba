import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { SyncProfileDto } from './auth.dto';
import { InitiatePasswordResetDto, VerifyPasswordResetDto } from './password-reset.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  // Unauthenticated — capped below the global default so it can't be used
  // as a fast email-enumeration oracle, while staying generous enough for
  // legitimate debounced-while-typing checks in the signup/admin-add forms.
  @Throttle({ default: { ttl: 60000, limit: 15 } })
  @Get('users/exists')
  @ApiOperation({ summary: 'Check if an email is already registered (pre-flight check)' })
  @ApiQuery({ name: 'email', required: true })
  exists(@Query('email') email: string) {
    return this.authService.emailExists(email);
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sync WSO2 user into local UserProfile. Call once after login.',
  })
  sync(@CurrentUser() user: any, @Body() dto: SyncProfileDto) {
    // Backend-detected role (from validated JWT groups claim) overrides whatever
    // the frontend sent — prevents role spoofing and fixes WSO2 claim mapping issues.
    return this.authService.sync(user.sub, {
      ...dto,
      email: dto.email || user.email,
      fullName: dto.fullName !== 'User' ? dto.fullName : (user.fullName || dto.fullName),
      role: user.detectedRole,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  me(@CurrentUser() user: any) {
    return this.authService.me(user.sub);
  }

  // ── Self-service password reset ──────────────────────────────

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('password-reset')
  @ApiOperation({ summary: 'Request a password reset OTP by email' })
  requestPasswordReset(@Body() dto: InitiatePasswordResetDto) {
    return this.passwordResetService.initiate(dto);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('password-reset/:requestId/verify')
  @ApiOperation({ summary: 'Verify the OTP and set a new password' })
  verifyPasswordReset(@Param('requestId') requestId: string, @Body() dto: VerifyPasswordResetDto) {
    return this.passwordResetService.verify(requestId, dto);
  }
}
