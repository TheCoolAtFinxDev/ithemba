import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BookAppointmentDto, CancelAppointmentDto, RescheduleAppointmentDto,
  SendOtpDto, ProviderAppointmentActionDto,
} from './appointments.dto';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  // ── Patient Appointments ─────────────────────────────────────

  async getPatientAppointments(userProfileId: string, patientId: string) {
    const patient = await this.verifyPatientOwnership(userProfileId, patientId);

    return this.prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        provider: {
          select: {
            id: true, firstName: true, lastName: true,
            clinicName: true, specialization: true, location: true,
          },
        },
        beneficiary: true,
      },
      orderBy: { startUtc: 'desc' },
    });
  }

  async getPatientAppointment(userProfileId: string, patientId: string, appointmentId: string) {
    const patient = await this.verifyPatientOwnership(userProfileId, patientId);

    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, patientId: patient.id },
      include: {
        provider: true,
        beneficiary: true,
        notes: true,
        otps: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async bookAppointment(userProfileId: string, patientId: string, dto: BookAppointmentDto) {
    const patient = await this.verifyPatientOwnership(userProfileId, patientId);

    // Verify provider exists and is active
    const provider = await this.prisma.provider.findUnique({
      where: { id: dto.providerId },
    });
    if (!provider || !provider.isActive) {
      throw new NotFoundException('Provider not found or inactive');
    }

    // Check for conflicts
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        providerId: dto.providerId,
        startUtc: new Date(dto.startUtc),
        status: { notIn: ['CancelledByPatient', 'CancelledByProvider', 'NoShow'] },
      },
    });
    if (conflict) {
      throw new BadRequestException('This time slot is already booked');
    }

    const appointment = await this.prisma.$transaction(async (tx) => {
      const apt = await tx.appointment.create({
        data: {
          patientId: patient.id,
          providerId: dto.providerId,
          beneficiaryId: dto.beneficiaryId,
          startUtc: new Date(dto.startUtc),
          endUtc: new Date(dto.endUtc),
          reason: dto.reason,
          status: 'Requested',
          createdBy: userProfileId,
        },
        include: {
          provider: {
            select: {
              firstName: true, lastName: true,
              clinicName: true, specialization: true,
            },
          },
        },
      });

      await tx.appointmentStatusChange.create({
        data: {
          appointmentId: apt.id,
          fromStatus: 'Requested',
          toStatus: 'Requested',
          changedByUserId: userProfileId,
        },
      });

      await tx.auditLogEntry.create({
        data: {
          userId: userProfileId,
          action: 'APPOINTMENT_BOOKED',
          entity: 'Appointment',
          entityId: apt.id,
        },
      });

      return apt;
    });

    return appointment;
  }

  async cancelAppointment(
    userProfileId: string, patientId: string,
    appointmentId: string, dto: CancelAppointmentDto,
  ) {
    const patient = await this.verifyPatientOwnership(userProfileId, patientId);
    const appointment = await this.findAppointmentForPatient(appointmentId, patient.id);

    if (['Completed', 'CancelledByPatient', 'CancelledByProvider'].includes(appointment.status)) {
      throw new BadRequestException(`Cannot cancel appointment with status: ${appointment.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'CancelledByPatient',
          cancellationReason: dto.reason,
          cancelledAtUtc: new Date(),
          cancelledByUserId: userProfileId,
          lastModifiedBy: userProfileId,
        },
      });

      await tx.appointmentStatusChange.create({
        data: {
          appointmentId,
          fromStatus: appointment.status as any,
          toStatus: 'CancelledByPatient',
          reason: dto.reason,
          changedByUserId: userProfileId,
        },
      });

      return updated;
    });
  }

  async rescheduleAppointment(
    userProfileId: string, patientId: string,
    appointmentId: string, dto: RescheduleAppointmentDto,
  ) {
    const patient = await this.verifyPatientOwnership(userProfileId, patientId);
    const appointment = await this.findAppointmentForPatient(appointmentId, patient.id);

    if (!['Requested', 'Scheduled'].includes(appointment.status)) {
      throw new BadRequestException('Cannot reschedule this appointment');
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        startUtc: new Date(dto.startUtc),
        endUtc: new Date(dto.endUtc),
        status: 'Rescheduled',
        lastModifiedBy: userProfileId,
      },
    });
  }

  async confirmAppointment(userProfileId: string, patientId: string, appointmentId: string) {
    const patient = await this.verifyPatientOwnership(userProfileId, patientId);
    const appointment = await this.findAppointmentForPatient(appointmentId, patient.id);

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'Confirmed',
        confirmedAtUtc: new Date(),
        confirmedByUserId: userProfileId,
        isConfirmedByClinic: false,
      },
    });
  }

  async sendOtp(
    userProfileId: string, patientId: string,
    appointmentId: string, dto: SendOtpDto,
  ) {
    const patient = await this.verifyPatientOwnership(userProfileId, patientId);
    const appointment = await this.findAppointmentForPatient(appointmentId, patient.id);

    if (!['Confirmed', 'Scheduled', 'Requested'].includes(appointment.status)) {
      throw new BadRequestException('Cannot send OTP for this appointment status');
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.appointmentOTP.create({
      data: {
        appointmentId,
        code,
        expiresAtUtc: expiresAt,
        deliveryChannel: dto.preferredChannel ?? 'Sms',
        destination: patient.phoneNumber,
      },
    });

    // Update appointment with visit code
    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { visitCode: code },
    });

    // TODO: Send via Novu when SMS provider is configured
    // await this.novu.sendVisitCode(userProfileId, { visitCode: code, ... });

    return {
      message: 'Visit code sent successfully',
      channel: dto.preferredChannel ?? 'Sms',
      expiresAt,
    };
  }

  // ── Provider Appointments ────────────────────────────────────

  async getProviderAppointments(userProfileId: string, providerId: string) {
    const provider = await this.verifyProviderOwnership(userProfileId, providerId);

    return this.prisma.appointment.findMany({
      where: { providerId: provider.id },
      include: {
        patient: {
          include: { userProfile: { select: { fullName: true, email: true } } },
        },
        beneficiary: true,
      },
      orderBy: { startUtc: 'asc' },
    });
  }

  async getProviderAppointment(userProfileId: string, providerId: string, appointmentId: string) {
    const provider = await this.verifyProviderOwnership(userProfileId, providerId);

    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, providerId: provider.id },
      include: {
        patient: {
          include: { userProfile: true, savingsAccount: true },
        },
        beneficiary: true,
        notes: true,
        otps: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async providerAction(
    userProfileId: string, providerId: string,
    appointmentId: string, action: string,
    dto: ProviderAppointmentActionDto = {},
  ) {
    const provider = await this.verifyProviderOwnership(userProfileId, providerId);
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, providerId: provider.id },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');

    const statusMap: Record<string, string> = {
      accept: 'Scheduled',
      reject: 'CancelledByProvider',
      'check-in': 'CheckedIn',
      start: 'InProgress',
      complete: 'Completed',
      'no-show': 'NoShow',
      cancel: 'CancelledByProvider',
    };

    const newStatus = statusMap[action];
    if (!newStatus) throw new BadRequestException(`Unknown action: ${action}`);

    const updateData: any = {
      status: newStatus,
      lastModifiedBy: userProfileId,
    };

    if (action === 'check-in') updateData.checkedInAtUtc = new Date();
    if (action === 'complete') updateData.completedAtUtc = new Date();
    if (action === 'accept') {
      updateData.isConfirmedByClinic = true;
      updateData.confirmedAtUtc = new Date();
      updateData.confirmedByUserId = userProfileId;
    }
    if (['reject', 'cancel'].includes(action)) {
      updateData.cancellationReason = dto.reason;
      updateData.cancelledAtUtc = new Date();
      updateData.cancelledByUserId = userProfileId;
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: updateData,
      });

      await tx.appointmentStatusChange.create({
        data: {
          appointmentId,
          fromStatus: appointment.status as any,
          toStatus: newStatus as any,
          reason: dto.reason,
          changedByUserId: userProfileId,
        },
      });

      if (dto.notes) {
        await tx.appointmentNote.create({
          data: {
            appointmentId,
            note: dto.notes,
            addedBy: userProfileId,
          },
        });
      }

      return updated;
    });
  }

  // ── Helpers ──────────────────────────────────────────────────

  private async verifyPatientOwnership(userProfileId: string, patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    if (patient.userProfileId !== userProfileId) throw new ForbiddenException();
    return patient;
  }

  private async verifyProviderOwnership(userProfileId: string, providerId: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });
    if (!provider) throw new NotFoundException('Provider not found');
    if (provider.userProfileId !== userProfileId) throw new ForbiddenException();
    return provider;
  }

  private async findAppointmentForPatient(appointmentId: string, patientId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, patientId },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }
}
