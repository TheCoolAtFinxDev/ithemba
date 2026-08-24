import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EmployerService } from './employer.service';
import {
  CreateEmployerDto, UpdateEmployerDto, AddMemberDto, UpdateMemberDto,
  UploadContributionsDto, GenerateInvoiceDto, ConfirmPaymentDto, BulkEnrollDto,
} from './employer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('employers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class EmployerController {
  constructor(private readonly employerService: EmployerService) {}

  // ── Admin endpoints ───────────────────────────────────────────────────────

  @Post('admin/employers')
  @UseGuards(RolesGuard) @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: create a new employer account' })
  create(@Body() dto: CreateEmployerDto, @CurrentUser() user: any) {
    return this.employerService.create(dto, user.sub);
  }

  @Get('admin/employers')
  @UseGuards(RolesGuard) @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: list all employers' })
  listAll() {
    return this.employerService.listAll();
  }

  @Put('admin/employers/:id/verify')
  @UseGuards(RolesGuard) @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: verify an employer account' })
  verify(@Param('id') id: string, @CurrentUser() user: any) {
    return this.employerService.verify(id, user.sub);
  }

  @Put('admin/employers/:id/activate')
  @UseGuards(RolesGuard) @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: activate employer account' })
  activate(@Param('id') id: string) {
    return this.employerService.setActive(id, true);
  }

  @Put('admin/employers/:id/deactivate')
  @UseGuards(RolesGuard) @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: deactivate employer account' })
  deactivate(@Param('id') id: string) {
    return this.employerService.setActive(id, false);
  }

  @Put('admin/employers/:id/billing/:cycleId/confirm')
  @UseGuards(RolesGuard) @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: confirm manual EFT payment received and credit employee HSAs' })
  confirmPayment(
    @Param('id') id: string,
    @Param('cycleId') cycleId: string,
    @Body() dto: ConfirmPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.employerService.confirmPayment(id, cycleId, dto, user.sub);
  }

  // ── Employer self-service endpoints ───────────────────────────────────────

  @Get('employers/me')
  @UseGuards(RolesGuard) @Roles('EMPLOYER')
  @ApiOperation({ summary: 'Employer: get own account details' })
  getMe(@CurrentUser() user: any) {
    return this.employerService.getMyEmployer(user.sub);
  }

  @Put('employers/:id')
  @UseGuards(RolesGuard) @Roles('EMPLOYER', 'ADMIN')
  @ApiOperation({ summary: 'Update employer profile' })
  update(@Param('id') id: string, @Body() dto: UpdateEmployerDto) {
    return this.employerService.update(id, dto);
  }

  // ── Members ───────────────────────────────────────────────────────────────

  @Get('employers/:id/members')
  @UseGuards(RolesGuard) @Roles('EMPLOYER', 'ADMIN')
  @ApiOperation({ summary: 'List all members of an employer' })
  listMembers(@Param('id') id: string) {
    return this.employerService.listMembers(id);
  }

  @Post('employers/:id/members')
  @UseGuards(RolesGuard) @Roles('EMPLOYER', 'ADMIN')
  @ApiOperation({ summary: 'Enroll a patient as an employer member' })
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto, @CurrentUser() user: any) {
    return this.employerService.addMember(id, dto, user.sub);
  }

  @Put('employers/:id/members/:membershipId')
  @UseGuards(RolesGuard) @Roles('EMPLOYER', 'ADMIN')
  @ApiOperation({ summary: 'Update member contribution amount or employee ref' })
  updateMember(
    @Param('id') id: string,
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.employerService.updateMember(id, membershipId, dto);
  }

  @Put('employers/:id/members/:membershipId/suspend')
  @UseGuards(RolesGuard) @Roles('EMPLOYER', 'ADMIN')
  @ApiOperation({ summary: 'Suspend a member (temporarily stop contributions)' })
  suspendMember(@Param('id') id: string, @Param('membershipId') membershipId: string) {
    return this.employerService.suspendMember(id, membershipId);
  }

  @Delete('employers/:id/members/:membershipId')
  @UseGuards(RolesGuard) @Roles('EMPLOYER', 'ADMIN')
  @ApiOperation({ summary: 'Terminate a member from the employer group plan' })
  terminateMember(@Param('id') id: string, @Param('membershipId') membershipId: string) {
    return this.employerService.terminateMember(id, membershipId);
  }

  @Post('employers/:id/members/bulk')
  @UseGuards(RolesGuard) @Roles('EMPLOYER', 'ADMIN')
  @ApiOperation({ summary: 'Bulk enroll employees from a list — links rows matching an existing patient by email/phone, invites the rest to register' })
  bulkEnroll(@Param('id') id: string, @Body() dto: BulkEnrollDto, @CurrentUser() user: any) {
    return this.employerService.bulkEnroll(id, dto, user.sub);
  }

  // ── Contributions upload ──────────────────────────────────────────────────

  @Post('employers/:id/contributions/upload')
  @UseGuards(RolesGuard) @Roles('EMPLOYER', 'ADMIN')
  @ApiOperation({ summary: 'Upload contribution amounts (payroll push / CSV / manual). Returns a preview before invoice is generated.' })
  uploadContributions(@Param('id') id: string, @Body() dto: UploadContributionsDto) {
    return this.employerService.uploadContributions(id, dto);
  }

  @Post('employers/:id/contributions/confirm')
  @UseGuards(RolesGuard) @Roles('EMPLOYER', 'ADMIN')
  @ApiOperation({ summary: 'Confirm a previewed contribution batch — persists the amounts and generates the invoice' })
  confirmContributions(@Param('id') id: string, @Body() dto: UploadContributionsDto, @CurrentUser() user: any) {
    return this.employerService.confirmContributionUpload(id, dto, user.sub);
  }

  // ── Billing cycles ────────────────────────────────────────────────────────

  @Get('employers/:id/billing')
  @UseGuards(RolesGuard) @Roles('EMPLOYER', 'ADMIN')
  @ApiOperation({ summary: 'List billing cycles for an employer' })
  listBillingCycles(@Param('id') id: string) {
    return this.employerService.listBillingCycles(id);
  }

  @Get('employers/:id/billing/:cycleId')
  @UseGuards(RolesGuard) @Roles('EMPLOYER', 'ADMIN')
  @ApiOperation({ summary: 'Get a billing cycle with line items' })
  getBillingCycle(@Param('id') id: string, @Param('cycleId') cycleId: string) {
    return this.employerService.getBillingCycle(id, cycleId);
  }

  @Post('employers/:id/billing/generate')
  @UseGuards(RolesGuard) @Roles('EMPLOYER', 'ADMIN')
  @ApiOperation({ summary: 'Generate a monthly invoice for all active members' })
  generateInvoice(
    @Param('id') id: string,
    @Body() dto: GenerateInvoiceDto,
    @CurrentUser() user: any,
  ) {
    return this.employerService.generateInvoice(id, dto, user.sub);
  }
}
