import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NovuService } from '../novu/novu.service';

const ACTIVE_STATUSES = ['Requested', 'Scheduled', 'Confirmed', 'Rescheduled'] as const;
const DEFAULT_ADVANCE_HOURS = 24;
const FINAL_HOURS = 1;
const LOOKAHEAD_DAYS = 7; // upper bound so a misconfigured advance preference can't scan the whole table

@Injectable()
export class AppointmentReminderTask {
  private readonly logger = new Logger(AppointmentReminderTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly novu: NovuService,
  ) {}

  @Cron('*/15 * * * *')
  async sendDueReminders() {
    const now = new Date();
    const upperBound = new Date(now.getTime() + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        status: { in: ACTIVE_STATUSES as unknown as string[] },
        startUtc: { gte: now, lte: upperBound },
        OR: [{ advanceReminderSentAt: null }, { finalReminderSentAt: null }],
      },
      include: {
        patient: {
          include: {
            userProfile: { include: { notificationPreference: true } },
          },
        },
        provider: { select: { firstName: true, lastName: true } },
      },
    });

    for (const apt of appointments) {
      const profile = apt.patient?.userProfile;
      if (!profile) continue;

      const hoursUntil = (apt.startUtc.getTime() - now.getTime()) / (60 * 60 * 1000);
      const providerName = `Dr. ${apt.provider.firstName} ${apt.provider.lastName ?? ''}`.trim();
      const appointmentDate = apt.startUtc.toLocaleDateString('en-ZA', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });

      try {
        const advanceHours = profile.notificationPreference?.reminderAdvanceHours ?? DEFAULT_ADVANCE_HOURS;
        if (!apt.advanceReminderSentAt && hoursUntil <= advanceHours && hoursUntil > FINAL_HOURS) {
          await this.novu.sendAppointmentReminderAdvance({
            subscriberId: profile.id, email: profile.email,
            firstName: profile.fullName?.split(' ')[0] ?? 'there',
            providerName, appointmentDate,
          });
          await this.prisma.appointment.update({
            where: { id: apt.id },
            data: { advanceReminderSentAt: now },
          });
        }

        if (!apt.finalReminderSentAt && hoursUntil <= FINAL_HOURS) {
          await this.novu.sendAppointmentReminderFinal({
            subscriberId: profile.id, email: profile.email, phone: apt.patient.phoneNumber || undefined,
            firstName: profile.fullName?.split(' ')[0] ?? 'there',
            providerName, appointmentDate,
          });
          await this.prisma.appointment.update({
            where: { id: apt.id },
            data: { finalReminderSentAt: now },
          });
        }
      } catch (err) {
        this.logger.error(`Reminder send failed for appointment ${apt.id}`, err);
      }
    }
  }
}
