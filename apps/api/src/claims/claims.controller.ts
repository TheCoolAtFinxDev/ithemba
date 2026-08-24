import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Res, UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ClaimsService } from './claims.service';
import { SubmitClaimDto, EditClaimDto, ReviewClaimDto } from './claims.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
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

  @Put('v1/providers/:providerId/claims/:claimId')
  @ApiOperation({ summary: 'Edit a claim still awaiting review' })
  editClaim(
    @CurrentUser() user: any,
    @Param('providerId') providerId: string,
    @Param('claimId') claimId: string,
    @Body() dto: EditClaimDto,
  ) {
    return this.claimsService.editClaim(user.sub, providerId, claimId, dto);
  }

  @Delete('v1/providers/:providerId/claims/:claimId')
  @ApiOperation({ summary: 'Withdraw a claim still awaiting review' })
  withdrawClaim(
    @CurrentUser() user: any,
    @Param('providerId') providerId: string,
    @Param('claimId') claimId: string,
  ) {
    return this.claimsService.withdrawClaim(user.sub, providerId, claimId);
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
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: list all claims' })
  @ApiQuery({ name: 'status', required: false })
  adminList(@Query('status') status?: string) {
    return this.claimsService.adminListClaims(status);
  }

  @Get('admin/claims/export')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: export claims as CSV' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async exportCsv(
    @Res() res: Response,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const csv = await this.claimsService.exportClaimsCsv(status, from, to);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="claims-export-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  }

  @Put('admin/claims/:claimId/approve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: approve claim and debit patient wallet' })
  approve(
    @CurrentUser() user: any,
    @Param('claimId') claimId: string,
    @Body() dto: ReviewClaimDto,
  ) {
    return this.claimsService.approveClaim(user.sub, claimId, dto);
  }

  @Put('admin/claims/:claimId/reject')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: reject claim' })
  reject(
    @CurrentUser() user: any,
    @Param('claimId') claimId: string,
    @Body() dto: ReviewClaimDto,
  ) {
    return this.claimsService.rejectClaim(user.sub, claimId, dto);
  }
}
