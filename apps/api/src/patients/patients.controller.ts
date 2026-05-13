import {
  Controller, Get, Post, Put, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { OnboardPatientDto, UpdatePatientAddressDto, TopUpDto } from './patients.dto';
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
}
