import {
  Injectable, NotFoundException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  OnboardProviderDto, UpdateProviderDto, UpdateWorkingHoursDto,
  ProviderAddressDto, ProviderSearchDto, CreateTimeOffDto,
} from './providers.dto';

const SLOT_DURATION_MINUTES = 30;

@Injectable()
export class ProvidersService {
  constructor(private prisma: PrismaService) {}

  // ── Profile ─────────────────────────────────────────────────

  async getMyProfile(userProfileId: string) {
    return this.prisma.provider.findUnique({
      where: { userProfileId },
      include: {
        specializations: true,
        qualifications: true,
        workingHours: { orderBy: { dayOfWeek: 'asc' } },
        addresses: true,
      },
    });
  }

  async onboard(userProfileId: string, dto: OnboardProviderDto) {
    const existing = await this.prisma.provider.findUnique({
      where: { userProfileId },
      include: { workingHours: true },
    });

    const provider = await this.prisma.$transaction(async (tx) => {
      let p;

      if (existing) {
        // Profile was auto-provisioned on sync — update with submitted details
        p = await tx.provider.update({
          where: { userProfileId },
          data: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            clinicName: dto.clinicName,
            specialization: dto.specialization,
            phoneNumber: dto.phoneNumber,
            email: dto.email ?? existing.email,
            medicalLicenseNumber: dto.medicalLicenseNumber ?? existing.medicalLicenseNumber,
            mpesaMerchantCode: dto.mpesaMerchantCode ?? existing.mpesaMerchantCode,
            about: dto.about ?? existing.about,
            location: dto.location ?? existing.location,
            lastModifiedBy: userProfileId,
          },
        });
      } else {
        p = await tx.provider.create({
          data: {
            userProfileId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            clinicName: dto.clinicName,
            specialization: dto.specialization,
            phoneNumber: dto.phoneNumber,
            email: dto.email ?? '',
            medicalLicenseNumber: dto.medicalLicenseNumber,
            mpesaMerchantCode: dto.mpesaMerchantCode ?? '',
            about: dto.about,
            location: dto.location ?? '',
            isActive: true,
            isVerified: false,
            createdBy: userProfileId,
          },
        });

        // Default working hours only for newly created providers
        await tx.workingHours.createMany({
          data: [1, 2, 3, 4, 5].map(day => ({
            providerId: p.id, dayOfWeek: day, startTime: '09:00', endTime: '17:00', isAvailable: true,
          })).concat([0, 6].map(day => ({
            providerId: p.id, dayOfWeek: day, startTime: '09:00', endTime: '17:00', isAvailable: false,
          }))),
        });
      }

      // Ensure PROVIDER role is assigned
      const role = await tx.role.findUnique({ where: { name: 'PROVIDER' } });
      if (role) {
        await tx.userRole.upsert({
          where: { userProfileId_roleId: { userProfileId, roleId: role.id } },
          create: { userProfileId, roleId: role.id },
          update: {},
        });
      }

      await tx.auditLogEntry.create({
        data: {
          userId: userProfileId,
          action: 'PROVIDER_ONBOARDED',
          entity: 'Provider',
          entityId: p.id,
        },
      });

      return p;
    });

    return provider;
  }

  async updateProfile(userProfileId: string, dto: UpdateProviderDto) {
    const provider = await this.prisma.provider.findUnique({
      where: { userProfileId },
    });
    if (!provider) throw new NotFoundException('Provider not found');

    return this.prisma.provider.update({
      where: { userProfileId },
      data: { ...dto, lastModifiedBy: userProfileId },
    });
  }

  // ── Working Hours ────────────────────────────────────────────

  async getWorkingHours(userProfileId: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { userProfileId },
    });
    if (!provider) throw new NotFoundException('Provider not found');

    return this.prisma.workingHours.findMany({
      where: { providerId: provider.id },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async updateWorkingHours(userProfileId: string, dto: UpdateWorkingHoursDto) {
    const provider = await this.prisma.provider.findUnique({
      where: { userProfileId },
    });
    if (!provider) throw new NotFoundException('Provider not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.workingHours.deleteMany({ where: { providerId: provider.id } });
      return tx.workingHours.createMany({
        data: dto.hours.map(h => ({
          providerId: provider.id,
          dayOfWeek: h.dayOfWeek,
          startTime: h.startTime,
          endTime: h.endTime,
          isAvailable: h.isAvailable,
        })),
      });
    });
  }

  // ── Address ──────────────────────────────────────────────────

  async updateAddress(userProfileId: string, dto: ProviderAddressDto) {
    const provider = await this.prisma.provider.findUnique({
      where: { userProfileId },
    });
    if (!provider) throw new NotFoundException('Provider not found');

    return this.prisma.providerAddress.create({
      data: {
        providerId: provider.id,
        addressLine1: dto.addressLine1,
        city: dto.city,
        district: dto.district,
        country: dto.country ?? 'Lesotho',
        isPrimary: dto.isPrimary ?? true,
      },
    });
  }

  // ── Search ───────────────────────────────────────────────────

  async search(dto: ProviderSearchDto) {
    const where: any = {
      isActive: true,
      isVerified: true,
    };

    if (dto.specialization) {
      where.specialization = { contains: dto.specialization, mode: 'insensitive' };
    }

    if (dto.query) {
      where.OR = [
        { clinicName: { contains: dto.query, mode: 'insensitive' } },
        { firstName: { contains: dto.query, mode: 'insensitive' } },
        { lastName: { contains: dto.query, mode: 'insensitive' } },
        { specialization: { contains: dto.query, mode: 'insensitive' } },
      ];
    }

    return this.prisma.provider.findMany({
      where,
      include: {
        workingHours: { where: { isAvailable: true } },
        addresses: { where: { isPrimary: true } },
        specializations: true,
      },
      orderBy: { clinicName: 'asc' },
    });
  }

  async getDetails(providerId: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        workingHours: { orderBy: { dayOfWeek: 'asc' } },
        addresses: true,
        specializations: true,
        qualifications: true,
      },
    });
    if (!provider) throw new NotFoundException('Provider not found');
    return provider;
  }

  // ── Slots ────────────────────────────────────────────────────

  async getSlots(providerId: string, dateStr: string) {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();

    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        workingHours: { where: { dayOfWeek, isAvailable: true } },
        timeOff: true,
      },
    });

    if (!provider) throw new NotFoundException('Provider not found');

    const hours = provider.workingHours[0];
    if (!hours) return { date: dateStr, slots: [], available: false };

    // Check time off
    const isOnLeave = provider.timeOff.some(to => {
      const start = new Date(to.startUtc);
      const end = new Date(to.endUtc);
      return date >= start && date <= end;
    });

    if (isOnLeave) return { date: dateStr, slots: [], available: false };

    // Generate 30-min slots
    const slots = this.generateSlots(hours.startTime, hours.endTime, date);

    // Get booked appointments for this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const booked = await this.prisma.appointment.findMany({
      where: {
        providerId,
        startUtc: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['CancelledByPatient', 'CancelledByProvider', 'NoShow'] },
      },
    });

    const bookedTimes = booked.map(a => a.startUtc.toISOString());

    return {
      date: dateStr,
      available: true,
      slots: slots.map(slot => ({
        startUtc: slot.start,
        endUtc: slot.end,
        label: `${slot.startLabel} - ${slot.endLabel}`,
        isBooked: bookedTimes.includes(slot.start),
      })),
    };
  }

  private generateSlots(startTime: string, endTime: string, date: Date) {
    const slots = [];
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const current = new Date(date);
    current.setHours(startH, startM, 0, 0);

    const end = new Date(date);
    end.setHours(endH, endM, 0, 0);

    while (current < end) {
      const slotEnd = new Date(current.getTime() + SLOT_DURATION_MINUTES * 60000);
      slots.push({
        start: current.toISOString(),
        end: slotEnd.toISOString(),
        startLabel: current.toTimeString().slice(0, 5),
        endLabel: slotEnd.toTimeString().slice(0, 5),
      });
      current.setTime(current.getTime() + SLOT_DURATION_MINUTES * 60000);
    }

    return slots;
  }

  // ── Time Off ─────────────────────────────────────────────────

  async createTimeOff(userProfileId: string, dto: CreateTimeOffDto) {
    const provider = await this.prisma.provider.findUnique({
      where: { userProfileId },
    });
    if (!provider) throw new NotFoundException('Provider not found');

    return this.prisma.providerTimeOff.create({
      data: {
        providerId: provider.id,
        startUtc: new Date(dto.startUtc),
        endUtc: new Date(dto.endUtc),
        reason: dto.reason,
      },
    });
  }

  async getTimeOff(userProfileId: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { userProfileId },
    });
    if (!provider) throw new NotFoundException('Provider not found');

    return this.prisma.providerTimeOff.findMany({
      where: {
        providerId: provider.id,
        endUtc: { gte: new Date() },
      },
      orderBy: { startUtc: 'asc' },
    });
  }

  async deleteTimeOff(userProfileId: string, timeOffId: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { userProfileId },
    });
    if (!provider) throw new NotFoundException('Provider not found');

    const timeOff = await this.prisma.providerTimeOff.findFirst({
      where: { id: timeOffId, providerId: provider.id },
    });
    if (!timeOff) throw new NotFoundException('Time off not found');

    return this.prisma.providerTimeOff.delete({ where: { id: timeOffId } });
  }
}
