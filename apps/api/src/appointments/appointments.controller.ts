import {
  Controller, Get, Post, Put, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import {
  BookAppointmentDto, CancelAppointmentDto, RescheduleAppointmentDto,
  SendOtpDto, ProviderAppointmentActionDto, VerifyVisitCodeDto,
} from './appointments.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // ── Patient endpoints ────────────────────────────────────────

  @Get('patients/:patientId/appointments')
  @ApiOperation({ summary: 'Get patient appointments' })
  getPatientAppointments(
    @CurrentUser() user: any,
    @Param('patientId') patientId: string,
  ) {
    return this.appointmentsService.getPatientAppointments(user.sub, patientId);
  }

  @Post('patients/:patientId/appointments')
  @ApiOperation({ summary: 'Book an appointment' })
  bookAppointment(
    @CurrentUser() user: any,
    @Param('patientId') patientId: string,
    @Body() dto: BookAppointmentDto,
  ) {
    return this.appointmentsService.bookAppointment(user.sub, patientId, dto);
  }

  @Get('patients/:patientId/appointments/:appointmentId')
  @ApiOperation({ summary: 'Get appointment detail' })
  getAppointment(
    @CurrentUser() user: any,
    @Param('patientId') patientId: string,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.appointmentsService.getPatientAppointment(user.sub, patientId, appointmentId);
  }

  @Put('patients/:patientId/appointments/:appointmentId/cancel')
  @ApiOperation({ summary: 'Cancel appointment' })
  cancelAppointment(
    @CurrentUser() user: any,
    @Param('patientId') patientId: string,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointmentsService.cancelAppointment(user.sub, patientId, appointmentId, dto);
  }

  @Put('patients/:patientId/appointments/:appointmentId/reschedule')
  @ApiOperation({ summary: 'Reschedule appointment' })
  rescheduleAppointment(
    @CurrentUser() user: any,
    @Param('patientId') patientId: string,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.rescheduleAppointment(user.sub, patientId, appointmentId, dto);
  }

  @Put('patients/:patientId/appointments/:appointmentId/confirm')
  @ApiOperation({ summary: 'Confirm appointment' })
  confirmAppointment(
    @CurrentUser() user: any,
    @Param('patientId') patientId: string,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.appointmentsService.confirmAppointment(user.sub, patientId, appointmentId);
  }

  @Post('patients/:patientId/appointments/:appointmentId/otp/send')
  @ApiOperation({ summary: 'Send visit code OTP' })
  sendOtp(
    @CurrentUser() user: any,
    @Param('patientId') patientId: string,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: SendOtpDto,
  ) {
    return this.appointmentsService.sendOtp(user.sub, patientId, appointmentId, dto);
  }

  // ── Provider endpoints ───────────────────────────────────────

  @Get('v1/providers/:providerId/appointments')
  @ApiOperation({ summary: 'Get provider appointments' })
  getProviderAppointments(
    @CurrentUser() user: any,
    @Param('providerId') providerId: string,
  ) {
    return this.appointmentsService.getProviderAppointments(user.sub, providerId);
  }

  @Get('v1/providers/:providerId/appointments/:appointmentId')
  @ApiOperation({ summary: 'Get provider appointment detail' })
  getProviderAppointment(
    @CurrentUser() user: any,
    @Param('providerId') providerId: string,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.appointmentsService.getProviderAppointment(user.sub, providerId, appointmentId);
  }

  @Put('v1/providers/:providerId/appointments/:appointmentId/accept')
  providerAccept(@CurrentUser() user: any, @Param('providerId') pid: string, @Param('appointmentId') aid: string, @Body() dto: ProviderAppointmentActionDto) {
    return this.appointmentsService.providerAction(user.sub, pid, aid, 'accept', dto);
  }

  @Put('v1/providers/:providerId/appointments/:appointmentId/reject')
  providerReject(@CurrentUser() user: any, @Param('providerId') pid: string, @Param('appointmentId') aid: string, @Body() dto: ProviderAppointmentActionDto) {
    return this.appointmentsService.providerAction(user.sub, pid, aid, 'reject', dto);
  }

  @Put('v1/providers/:providerId/appointments/:appointmentId/check-in')
  providerCheckIn(@CurrentUser() user: any, @Param('providerId') pid: string, @Param('appointmentId') aid: string, @Body() dto: ProviderAppointmentActionDto) {
    return this.appointmentsService.providerAction(user.sub, pid, aid, 'check-in', dto);
  }

  @Put('v1/providers/:providerId/appointments/:appointmentId/start')
  providerStart(@CurrentUser() user: any, @Param('providerId') pid: string, @Param('appointmentId') aid: string, @Body() dto: ProviderAppointmentActionDto) {
    return this.appointmentsService.providerAction(user.sub, pid, aid, 'start', dto);
  }

  @Put('v1/providers/:providerId/appointments/:appointmentId/complete')
  providerComplete(@CurrentUser() user: any, @Param('providerId') pid: string, @Param('appointmentId') aid: string, @Body() dto: ProviderAppointmentActionDto) {
    return this.appointmentsService.providerAction(user.sub, pid, aid, 'complete', dto);
  }

  @Put('v1/providers/:providerId/appointments/:appointmentId/no-show')
  providerNoShow(@CurrentUser() user: any, @Param('providerId') pid: string, @Param('appointmentId') aid: string, @Body() dto: ProviderAppointmentActionDto) {
    return this.appointmentsService.providerAction(user.sub, pid, aid, 'no-show', dto);
  }

  @Put('v1/providers/:providerId/appointments/:appointmentId/reschedule')
  providerReschedule(@CurrentUser() user: any, @Param('providerId') pid: string, @Param('appointmentId') aid: string, @Body() dto: RescheduleAppointmentDto) {
    return this.appointmentsService.providerReschedule(user.sub, pid, aid, dto);
  }

  @Put('v1/providers/:providerId/appointments/:appointmentId/cancel')
  providerCancel(@CurrentUser() user: any, @Param('providerId') pid: string, @Param('appointmentId') aid: string, @Body() dto: ProviderAppointmentActionDto) {
    return this.appointmentsService.providerAction(user.sub, pid, aid, 'cancel', dto);
  }

  @Post('v1/providers/:providerId/appointments/:appointmentId/verify-otp')
  @ApiOperation({ summary: 'Verify patient visit code and check in' })
  verifyVisitCode(
    @CurrentUser() user: any,
    @Param('providerId') providerId: string,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: VerifyVisitCodeDto,
  ) {
    return this.appointmentsService.verifyVisitCode(user.sub, providerId, appointmentId, dto);
  }
}
