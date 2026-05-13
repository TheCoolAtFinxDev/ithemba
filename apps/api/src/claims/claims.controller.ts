import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ClaimsService } from './claims.service';
import { SubmitClaimDto, ReviewClaimDto } from './claims.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('claims')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  // ── Provider endpoints ───────────────────────────────────────

  @Post('v1/providers/:providerId/claims')
  @ApiOperation({ summary: 'Submit a claim for a completed appointment' })
  submit(
    @CurrentUser() user: any,
    @Param('providerId') providerId: string,
    @Body() dto: SubmitClaimDto,
  ) {
    return this.claimsService.submitClaim(user.sub, providerId, dto);
  }

  @Get('v1/providers/:providerId/claims')
  @ApiOperation({ summary: 'Get provider claims' })
  getProviderClaims(
    @CurrentUser() user: any,
    @Param('providerId') providerId: string,
  ) {
    return this.claimsService.getProviderClaims(user.sub, providerId);
  }

  // ── Patient endpoints ────────────────────────────────────────

  @Get('patients/:patientId/claims')
  @ApiOperation({ summary: 'Get claims against patient wallet' })
  getPatientClaims(
    @CurrentUser() user: any,
    @Param('patientId') patientId: string,
  ) {
    return this.claimsService.getPatientClaims(user.sub, patientId);
  }

  // ── Admin endpoints ──────────────────────────────────────────

  @Get('admin/claims')
  @ApiOperation({ summary: 'Admin: list all claims' })
  @ApiQuery({ name: 'status', required: false })
  adminList(@Query('status') status?: string) {
    return this.claimsService.adminListClaims(status);
  }

  @Put('admin/claims/:claimId/approve')
  @ApiOperation({ summary: 'Admin: approve claim and debit patient wallet' })
  approve(
    @CurrentUser() user: any,
    @Param('claimId') claimId: string,
    @Body() dto: ReviewClaimDto,
  ) {
    return this.claimsService.approveClaim(user.sub, claimId, dto);
  }

  @Put('admin/claims/:claimId/reject')
  @ApiOperation({ summary: 'Admin: reject claim' })
  reject(
    @CurrentUser() user: any,
    @Param('claimId') claimId: string,
    @Body() dto: ReviewClaimDto,
  ) {
    return this.claimsService.rejectClaim(user.sub, claimId, dto);
  }
}
