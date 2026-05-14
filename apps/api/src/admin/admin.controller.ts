import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AssignRoleDto {
  @ApiProperty()
  @IsString()
  roleName: string;
}

class CreateRoleDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

class AssignPermissionDto {
  @ApiProperty()
  @IsString()
  permissionId: string;
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

  @Post('users/:userId/lock')
  @ApiOperation({ summary: 'Lock a user account' })
  lockUser(@CurrentUser() user: any, @Param('userId') userId: string) {
    return this.adminService.lockUser(user.sub, userId);
  }

  @Post('users/:userId/unlock')
  @ApiOperation({ summary: 'Unlock a user account' })
  unlockUser(@CurrentUser() user: any, @Param('userId') userId: string) {
    return this.adminService.unlockUser(user.sub, userId);
  }

  @Post('users/:userId/roles')
  @ApiOperation({ summary: 'Assign role to user' })
  assignRole(
    @CurrentUser() user: any,
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.adminService.assignRole(user.sub, userId, dto.roleName);
  }

  @Post('providers/:providerId/verify')
  @ApiOperation({ summary: 'Verify a provider (allow them to appear in search)' })
  verifyProvider(@CurrentUser() user: any, @Param('providerId') providerId: string) {
    return this.adminService.verifyProvider(user.sub, providerId);
  }

  // ── RBAC ──────────────────────────────────────────────────────

  @Get('roles')
  @ApiOperation({ summary: 'List all roles with permissions' })
  listRoles() {
    return this.adminService.listRoles();
  }

  @Post('roles')
  @ApiOperation({ summary: 'Create a new role' })
  createRole(@Body() dto: CreateRoleDto) {
    return this.adminService.createRole(dto.name, dto.description);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'List all permissions' })
  listPermissions() {
    return this.adminService.listPermissions();
  }

  @Post('roles/:roleId/permissions')
  @ApiOperation({ summary: 'Assign permission to role' })
  assignPermission(
    @Param('roleId') roleId: string,
    @Body() dto: AssignPermissionDto,
  ) {
    return this.adminService.assignPermissionToRole(roleId, dto.permissionId);
  }
}
