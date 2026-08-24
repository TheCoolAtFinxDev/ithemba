import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NovuService } from '../novu/novu.service';
import {
  BookAppointmentDto, CancelAppointmentDto, RescheduleAppointmentDto,
  SendOtpDto, ProviderAppointmentActionDto, VerifyVisitCodeDto,
} from './appointments.dto';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private novu: NovuService,
  ) {}

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

    try {
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

      const patientProfile = await this.prisma.userProfile.findUnique({ where: { id: userProfileId } });
      if (provider.email) {
        const appointmentDate = new Date(appointment.startUtc).toLocaleDateString('en-ZA', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
        await this.novu.sendNewAppointmentRequest({
          subscriberId: provider.userProfileId, email: provider.email,
          firstName: provider.firstName, patientName: patientProfile?.fullName ?? 'A patient',
          appointmentDate,
        });
      }

      return appointment;
    } catch (err) {
      // The findFirst check above has a race window between two concurrent
      // bookings for the same slot — the DB-level partial unique index
      // (migration 20260713150000) is the actual guarantee; this just turns
      // its violation into the same clean error as the pre-check above.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new BadRequestException('This time slot is already booked');
      }
      throw err;
    }
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

    const updated = await this.prisma.$transaction(async (tx) => {
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

    const [provider, patientProfile] = await Promise.all([
      this.prisma.provider.findUnique({ where: { id: appointment.providerId } }),
      this.prisma.userProfile.findUnique({ where: { id: userProfileId } }),
    ]);
    if (provider?.email) {
      const appointmentDate = new Date(appointment.startUtc).toLocaleDateString('en-ZA', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
      await this.novu.sendAppointmentCancelledByPatient({
        subscriberId: provider.userProfileId, email: provider.email,
        firstName: provider.firstName, patientName: patientProfile?.fullName ?? 'A patient',
        appointmentDate, reason: dto.reason,
      });
    }

    return updated;
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
    appointmentId: string, _dto: SendOtpDto,
  ) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: { userProfile: { select: { fullName: true, email: true } } },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    if (patient.userProfileId !== userProfileId) throw new ForbiddenException();

    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, patientId: patient.id },
      include: { provider: { select: { firstName: true, lastName: true } } },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');

    if (!['Confirmed', 'Scheduled', 'Requested'].includes(appointment.status)) {
      throw new BadRequestException('Cannot send OTP for this appointment status');
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const email = patient.userProfile?.email ?? '';

    await this.prisma.appointmentOTP.create({
      data: {
        appointmentId,
        code,
        expiresAtUtc: expiresAt,
        deliveryChannel: 'Email',
        destination: email,
      },
    });

    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { visitCode: code },
    });

    const providerName = `Dr. ${appointment.provider.firstName} ${appointment.provider.lastName ?? ''}`.trim();
    const apptDate = new Date(appointment.startUtc).toLocaleDateString('en-ZA', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    await this.novu.sendVisitCode({
      subscriberId: userProfileId,
      email,
      firstName: patient.userProfile?.fullName?.split(' ')[0] ?? 'Patient',
      visitCode: code,
      appointmentDate: apptDate,
      providerName,
    });

    return {
      message: 'Visit code sent to your email',
      channel: 'Email',
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
          include: {
            userProfile: { select: { fullName: true, email: true } },
            savingsAccount: { select: { balance: true } },
          },
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

    const updated = await this.prisma.$transaction(async (tx) => {
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

    if (action === 'accept' || action === 'reject') {
      await this.notifyPatientOfProviderDecision(updated, action, dto.reason);
    }

    return updated;
  }

  private async notifyPatientOfProviderDecision(
    appointment: { id: string; patientId: string; providerId: string; startUtc: Date },
    action: 'accept' | 'reject',
    reason?: string,
  ) {
    const [patient, provider] = await Promise.all([
      this.prisma.patient.findUnique({
        where: { id: appointment.patientId },
        include: { userProfile: { select: { id: true, fullName: true, email: true } } },
      }),
      this.prisma.provider.findUnique({
        where: { id: appointment.providerId },
        select: { firstName: true, lastName: true },
      }),
    ]);
    if (!patient?.userProfile?.email || !provider) return;

    const providerName = `Dr. ${provider.firstName} ${provider.lastName ?? ''}`.trim();
    const appointmentDate = new Date(appointment.startUtc).toLocaleDateString('en-ZA', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    const firstName = patient.userProfile.fullName?.split(' ')[0] ?? 'Patient';

    if (action === 'accept') {
      await this.novu.sendAppointmentAccepted({
        subscriberId: patient.userProfile.id,
        email: patient.userProfile.email,
        firstName,
        appointmentDate,
        providerName,
      });
    } else {
      await this.novu.sendAppointmentRejected({
        subscriberId: patient.userProfile.id,
        email: patient.userProfile.email,
        firstName,
        appointmentDate,
        providerName,
        reason,
      });
    }
  }

  async providerReschedule(
    userProfileId: string, providerId: string,
    appointmentId: string, dto: RescheduleAppointmentDto,
  ) {
    const provider = await this.verifyProviderOwnership(userProfileId, providerId);
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, providerId: provider.id },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');

    if (!['Requested', 'Scheduled', 'Confirmed'].includes(appointment.status)) {
      throw new BadRequestException('Cannot reschedule this appointment');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          startUtc: new Date(dto.startUtc),
          endUtc: new Date(dto.endUtc),
          status: 'Rescheduled',
          lastModifiedBy: userProfileId,
        },
      });

      await tx.appointmentStatusChange.create({
        data: {
          appointmentId,
          fromStatus: appointment.status as any,
          toStatus: 'Rescheduled' as any,
          reason: 'Rescheduled by provider',
          changedByUserId: userProfileId,
        },
      });

      return updated;
    });
  }

  async verifyVisitCode(
    userProfileId: string, providerId: string,
    appointmentId: string, dto: VerifyVisitCodeDto,
  ) {
    const provider = await this.verifyProviderOwnership(userProfileId, providerId);
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, providerId: provider.id },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');

    if (!['Scheduled', 'Confirmed', 'Requested', 'Rescheduled'].includes(appointment.status)) {
      throw new BadRequestException('Cannot verify visit code for this appointment status');
    }

    const otp = await this.prisma.appointmentOTP.findFirst({
      where: {
        appointmentId,
        isUsed: false,
        expiresAtUtc: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw new BadRequestException('No valid visit code found. Ask the patient to request a new code.');
    if (otp.code !== dto.code.trim()) throw new BadRequestException('Invalid visit code');

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.appointmentOTP.update({
        where: { id: otp.id },
        data: { isUsed: true, usedAtUtc: new Date() },
      });

      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'CheckedIn',
          checkedInAtUtc: new Date(),
          lastModifiedBy: userProfileId,
        },
      });

      await tx.appointmentStatusChange.create({
        data: {
          appointmentId,
          fromStatus: appointment.status as any,
          toStatus: 'CheckedIn',
          reason: 'Visit code verified',
          changedByUserId: userProfileId,
        },
      });

      return updated;
    });

    const patient = await this.prisma.patient.findUnique({
      where: { id: appointment.patientId },
      include: { userProfile: { select: { id: true, fullName: true, email: true } } },
    });
    if (patient?.userProfile?.email) {
      const appointmentDate = new Date(appointment.startUtc).toLocaleDateString('en-ZA', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
      await this.novu.sendAppointmentCheckedIn({
        subscriberId: patient.userProfile.id, email: patient.userProfile.email,
        firstName: patient.userProfile.fullName?.split(' ')[0] ?? 'there',
        providerName: `Dr. ${provider.firstName} ${provider.lastName ?? ''}`.trim(),
        appointmentDate,
      });
    }

    return updated;
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
