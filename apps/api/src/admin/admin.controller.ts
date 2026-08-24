import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards, DefaultValuePipe, ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { IsString, IsOptional, IsArray, ValidateNested, IsEmail, IsNumber, IsNotEmpty, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class AssignRoleDto {
  @ApiProperty() @IsString() roleName: string;
}

class InviteUserDto {
  @ApiProperty() @IsString() email: string;
  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;
  @ApiProperty() @IsString() phoneNumber: string;
  @ApiProperty({ enum: ['PATIENT', 'PROVIDER', 'ADMIN', 'EMPLOYER'] }) @IsString() role: string;
}

class CreateProviderDto {
  @ApiProperty() @IsString() @IsEmail() email: string;
  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;
  @ApiProperty() @IsString() clinicName: string;
  @ApiProperty() @IsString() specialization: string;
  @ApiProperty() @IsString() phoneNumber: string;
  @ApiProperty() @IsString() location: string;
  @ApiPropertyOptional() @IsOptional() @IsString() about?: string;
}

class UpdateProviderDto {
  @ApiPropertyOptional() @IsOptional() @IsString() firstName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() lastName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() clinicName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() specialization?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phoneNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() about?: string;
}

class ImportProvidersDto {
  @ApiProperty({ type: [CreateProviderDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProviderDto)
  rows: CreateProviderDto[];
}

class CreateRoleDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

class AssignPermissionDto {
  @ApiProperty() @IsString() permissionId: string;
}

class AdjustWalletDto {
  // Bounded to the AML lump-sum threshold used elsewhere (CLAUDE.md business
  // rules) — a manual admin adjustment has no legitimate reason to exceed it.
  @ApiProperty({ description: 'Positive to credit, negative to debit (max magnitude 50,000)' })
  @IsNumber() @Min(-50000) @Max(50000) amount: number;
  @ApiProperty() @IsString() @IsNotEmpty() reason: string;
}

class SetProviderDisbursementDto {
  @ApiProperty() @IsBoolean() enabled: boolean;
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard stats' })
  getStats() {
    return this.adminService.getStats();
  }

  // ── Users ─────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  @ApiQuery({ name: 'search', required: false })
  listUsers(@Query('search') search?: string) {
    return this.adminService.listUsers(search);
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get a single user by id' })
  getUser(@Param('userId') userId: string) {
    return this.adminService.getUserById(userId);
  }

  @Post('users/:userId/lock')
  lockUser(@CurrentUser() user: any, @Param('userId') userId: string) {
    return this.adminService.lockUser(user.sub, userId);
  }

  @Post('users/:userId/unlock')
  unlockUser(@CurrentUser() user: any, @Param('userId') userId: string) {
    return this.adminService.unlockUser(user.sub, userId);
  }

  @Post('users/:userId/roles')
  assignRole(@CurrentUser() user: any, @Param('userId') userId: string, @Body() dto: AssignRoleDto) {
    return this.adminService.assignRole(user.sub, userId, dto.roleName);
  }

  @Post('users/invite')
  @ApiOperation({ summary: 'Admin creates any user account and sends invite email' })
  inviteUser(@CurrentUser() user: any, @Body() dto: InviteUserDto) {
    return this.adminService.inviteUser(user.sub, dto);
  }

  // ── Providers ─────────────────────────────────────────────────

  @Post('providers/create')
  @ApiOperation({ summary: 'Admin creates a provider account with full profile' })
  createProvider(@CurrentUser() user: any, @Body() dto: CreateProviderDto) {
    return this.adminService.createProvider(user.sub, dto);
  }

  @Post('providers/import-csv')
  @ApiOperation({ summary: 'Bulk-import providers from parsed CSV rows' })
  importProviders(@CurrentUser() user: any, @Body() dto: ImportProvidersDto) {
    return this.adminService.importProviders(user.sub, dto.rows);
  }

  @Post('providers/:providerId/verify')
  @ApiOperation({ summary: 'Verify a provider' })
  verifyProvider(@CurrentUser() user: any, @Param('providerId') providerId: string) {
    return this.adminService.verifyProvider(user.sub, providerId);
  }

  @Put('providers/:providerId')
  @ApiOperation({ summary: 'Edit a provider profile' })
  updateProvider(
    @CurrentUser() user: any,
    @Param('providerId') providerId: string,
    @Body() dto: UpdateProviderDto,
  ) {
    return this.adminService.updateProvider(user.sub, providerId, dto);
  }

  @Post('providers/:providerId/deactivate')
  @ApiOperation({ summary: 'Deactivate a provider (soft delete — hides from patient search, keeps history)' })
  deactivateProvider(@CurrentUser() user: any, @Param('providerId') providerId: string) {
    return this.adminService.setProviderActive(user.sub, providerId, false);
  }

  @Post('providers/:providerId/activate')
  @ApiOperation({ summary: 'Reactivate a previously deactivated provider' })
  activateProvider(@CurrentUser() user: any, @Param('providerId') providerId: string) {
    return this.adminService.setProviderActive(user.sub, providerId, true);
  }

  @Post('providers/:providerId/disbursement')
  @ApiOperation({ summary: 'Enable/disable live Golink claim disbursement for a provider (default off)' })
  setProviderDisbursement(
    @CurrentUser() user: any,
    @Param('providerId') providerId: string,
    @Body() dto: SetProviderDisbursementDto,
  ) {
    return this.adminService.setProviderDisbursement(user.sub, providerId, dto.enabled);
  }

  // ── Wallet ────────────────────────────────────────────────────

  @Post('patients/:patientId/wallet/adjust')
  @ApiOperation({ summary: 'Manually credit/debit a patient HSA balance (support/dispute resolution)' })
  adjustWallet(@CurrentUser() user: any, @Param('patientId') patientId: string, @Body() dto: AdjustWalletDto) {
    return this.adminService.adjustWalletBalance(user.sub, patientId, dto.amount, dto.reason);
  }

  // ── Appointments ──────────────────────────────────────────────

  @Get('appointments')
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listAppointments(
    @Query('status') status?: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit?: number,
  ) {
    return this.adminService.listAppointments(status, limit);
  }

  @Get('audit')
  @ApiQuery({ name: 'limit', required: false })
  listAudit(@Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number) {
    return this.adminService.listAudit(limit);
  }

  // ── System Settings ───────────────────────────────────────────

  @Get('settings')
  @ApiOperation({ summary: 'List all configurable business-rule settings' })
  listSettings() {
    return this.adminService.listSettings();
  }

  @Put('settings/:key')
  @ApiOperation({ summary: 'Update a business-rule setting' })
  updateSetting(
    @CurrentUser() user: any,
    @Param('key') key: string,
    @Body() dto: { value: string },
  ) {
    return this.adminService.updateSetting(user.sub, key, dto.value);
  }

  // ── RBAC ──────────────────────────────────────────────────────

  @Get('roles')
  listRoles() { return this.adminService.listRoles(); }

  @Post('roles')
  createRole(@Body() dto: CreateRoleDto) {
    return this.adminService.createRole(dto.name, dto.description);
  }

  @Get('permissions')
  listPermissions() { return this.adminService.listPermissions(); }

  @Post('roles/:roleId/permissions')
  assignPermission(@Param('roleId') roleId: string, @Body() dto: AssignPermissionDto) {
    return this.adminService.assignPermissionToRole(roleId, dto.permissionId);
  }
}
