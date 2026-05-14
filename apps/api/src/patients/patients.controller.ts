import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { OnboardPatientDto, UpdatePatientAddressDto, TopUpDto, AddBeneficiaryDto, UpdatePatientProfileDto } from './patients.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get('patients/profile')
  @ApiOperation({ summary: 'Get current patient profile' })
  getMyProfile(@CurrentUser() user: any) {
    return this.patientsService.getProfile(user.sub);
  }

  @Put('patients/profile')
  @ApiOperation({ summary: 'Update patient profile (phone, DOB, national ID)' })
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdatePatientProfileDto) {
    return this.patientsService.updateProfile(user.sub, dto);
  }

  @Put('patients/profile/address')
  @ApiOperation({ summary: 'Update patient address' })
  updateAddress(
    @CurrentUser() user: any,
    @Body() dto: UpdatePatientAddressDto,
  ) {
    return this.patientsService.updateAddress(user.sub, dto);
  }

  @Post('v1/users/:userId/patient/onboard')
  @ApiOperation({ summary: 'Onboard user as patient' })
  onboard(
    @Param('userId') userId: string,
    @CurrentUser() user: any,
    @Body() dto: OnboardPatientDto,
  ) {
    // Users can only onboard themselves
    return this.patientsService.onboard(user.sub, dto);
  }

  @Get('patients/:patientId')
  @ApiOperation({ summary: 'Get patient by ID' })
  findById(
    @Param('patientId') patientId: string,
    @CurrentUser() user: any,
  ) {
    return this.patientsService.findById(patientId, user.sub);
  }

  // ── Wallet ────────────────────────────────────────────────────

  @Get('patients/:patientId/wallet')
  @ApiOperation({ summary: 'Get HSA wallet balance' })
  getWallet(@CurrentUser() user: any, @Param('patientId') patientId: string) {
    return this.patientsService.getWallet(user.sub, patientId);
  }

  @Post('patients/:patientId/wallet/topup')
  @ApiOperation({ summary: 'Top up HSA via M-Pesa (stub)' })
  topup(
    @CurrentUser() user: any,
    @Param('patientId') patientId: string,
    @Body() dto: TopUpDto,
  ) {
    return this.patientsService.topup(user.sub, patientId, dto);
  }

  @Get('patients/:patientId/wallet/transactions')
  @ApiOperation({ summary: 'Get HSA transaction history' })
  getTransactions(@CurrentUser() user: any, @Param('patientId') patientId: string) {
    return this.patientsService.getTransactions(user.sub, patientId);
  }

  // ── Beneficiaries ─────────────────────────────────────────────

  @Get('patients/:patientId/beneficiaries')
  @ApiOperation({ summary: 'List active beneficiaries' })
  listBeneficiaries(@CurrentUser() user: any, @Param('patientId') patientId: string) {
    return this.patientsService.listBeneficiaries(user.sub, patientId);
  }

  @Post('patients/:patientId/beneficiaries')
  @ApiOperation({ summary: 'Add a beneficiary' })
  addBeneficiary(
    @CurrentUser() user: any,
    @Param('patientId') patientId: string,
    @Body() dto: AddBeneficiaryDto,
  ) {
    return this.patientsService.addBeneficiary(user.sub, patientId, dto);
  }

  @Delete('patients/:patientId/beneficiaries/:beneficiaryId')
  @ApiOperation({ summary: 'Remove (deactivate) a beneficiary' })
  removeBeneficiary(
    @CurrentUser() user: any,
    @Param('patientId') patientId: string,
    @Param('beneficiaryId') beneficiaryId: string,
  ) {
    return this.patientsService.removeBeneficiary(user.sub, patientId, beneficiaryId);
  }
}
