import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import {
  OnboardProviderDto, UpdateProviderDto, UpdateWorkingHoursDto,
  ProviderAddressDto, ProviderSearchDto, CreateTimeOffDto,
} from './providers.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('providers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  // ── Profile (provider-only — WSO2 group is assigned at account-creation
  // time, before onboarding, so the PROVIDER role is already on the JWT) ──

  @UseGuards(RolesGuard)
  @Roles('PROVIDER')
  @Get('v1/providers/profile/Me')
  @ApiOperation({ summary: 'Get my provider profile' })
  getMyProfile(@CurrentUser() user: any) {
    return this.providersService.getMyProfile(user.sub);
  }

  @UseGuards(RolesGuard)
  @Roles('PROVIDER')
  @Post('v1/users/:userId/provider/onboard')
  @ApiOperation({ summary: 'Onboard user as provider' })
  onboard(@CurrentUser() user: any, @Body() dto: OnboardProviderDto) {
    return this.providersService.onboard(user.sub, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('PROVIDER')
  @Put('v1/providers/profile/update')
  @ApiOperation({ summary: 'Update provider profile' })
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProviderDto) {
    return this.providersService.updateProfile(user.sub, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('PROVIDER')
  @Put('v1/providers/profile/address')
  @ApiOperation({ summary: 'Add/update provider address' })
  updateAddress(@CurrentUser() user: any, @Body() dto: ProviderAddressDto) {
    return this.providersService.updateAddress(user.sub, dto);
  }

  // ── Working Hours (provider-only) ─────────────────────────────

  @UseGuards(RolesGuard)
  @Roles('PROVIDER')
  @Get('v1/providers/profile/hours')
  @ApiOperation({ summary: 'Get provider working hours' })
  getHours(@CurrentUser() user: any) {
    return this.providersService.getWorkingHours(user.sub);
  }

  @UseGuards(RolesGuard)
  @Roles('PROVIDER')
  @Put('v1/providers/profile/hours')
  @ApiOperation({ summary: 'Update provider working hours' })
  updateHours(@CurrentUser() user: any, @Body() dto: UpdateWorkingHoursDto) {
    return this.providersService.updateWorkingHours(user.sub, dto);
  }

  // ── Search (intentionally open to any authenticated role — patients use
  // these to find and book doctors) ─────────────────────────────

  @Get('v1/providers/profile/search')
  @ApiOperation({ summary: 'Search providers' })
  search(@Query() dto: ProviderSearchDto) {
    return this.providersService.search(dto);
  }

  @Get('v1/providers/profile/details')
  @ApiOperation({ summary: 'Get provider details by ID' })
  getDetails(@Query('providerId') providerId: string) {
    return this.providersService.getDetails(providerId);
  }

  @Get('v1/providers/profile/slots')
  @ApiOperation({ summary: 'Get available slots for a provider on a date' })
  getSlots(
    @Query('providerId') providerId: string,
    @Query('date') date: string,
  ) {
    return this.providersService.getSlots(providerId, date);
  }

  // ── Time Off (provider-only) ────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles('PROVIDER')
  @Get('v1/providers/:providerId/time-off')
  @ApiOperation({ summary: 'Get provider time off' })
  getTimeOff(@CurrentUser() user: any) {
    return this.providersService.getTimeOff(user.sub);
  }

  @UseGuards(RolesGuard)
  @Roles('PROVIDER')
  @Post('v1/providers/:providerId/time-off')
  @ApiOperation({ summary: 'Create time off' })
  createTimeOff(@CurrentUser() user: any, @Body() dto: CreateTimeOffDto) {
    return this.providersService.createTimeOff(user.sub, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('PROVIDER')
  @Delete('v1/providers/:providerId/time-off/:timeOffId')
  @ApiOperation({ summary: 'Delete time off' })
  deleteTimeOff(
    @CurrentUser() user: any,
    @Param('timeOffId') timeOffId: string,
  ) {
    return this.providersService.deleteTimeOff(user.sub, timeOffId);
  }
}
