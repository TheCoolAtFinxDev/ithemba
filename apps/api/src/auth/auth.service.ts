import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncProfileDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

async sync(sub: string, dto: SyncProfileDto) {
  const profile = await this.prisma.userProfile.upsert({
    where: { id: sub },
    create: {
      id: sub,
      email: dto.email ?? `${sub}@wso2.local`,
      fullName: dto.fullName,
      clinicName: dto.clinicName,
      medicalLicenseNumber: dto.medicalLicenseNumber,
    },
    update: {
      fullName: dto.fullName,
      clinicName: dto.clinicName,
      medicalLicenseNumber: dto.medicalLicenseNumber,
    },
  });

  // Assign default role if user has no roles yet
  const existingRoles = await this.prisma.userRole.count({
    where: { userProfileId: sub },
  });

  let roleName = dto.role ?? 'PATIENT';

  if (existingRoles === 0) {
    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (role) {
      await this.prisma.userRole.create({
        data: { userProfileId: sub, roleId: role.id },
      });
    }
  } else {
    // Derive current primary role for provisioning logic below
    const userRole = await this.prisma.userRole.findFirst({
      where: { userProfileId: sub },
      include: { role: true },
    });
    roleName = userRole?.role?.name ?? roleName;
  }

  // Auto-provision patient record + HSA on first login
  if (roleName === 'PATIENT') {
    const existingPatient = await this.prisma.patient.findUnique({ where: { userProfileId: sub } });
    if (!existingPatient) {
      const patient = await this.prisma.patient.create({
        data: { userProfileId: sub, createdBy: sub },
      });
      await this.prisma.healthSavingsAccount.create({
        data: {
          patientId: patient.id,
          balance: 0,
          totalContributed: 0,
          totalClaimed: 0,
          isDefault: true,
          createdBy: sub,
        },
      });
    }
  }

  // Auto-provision provider record + default working hours on first login
  if (roleName === 'PROVIDER') {
    const existingProvider = await this.prisma.provider.findUnique({ where: { userProfileId: sub } });
    if (!existingProvider) {
      const nameParts = (dto.fullName ?? '').trim().split(' ');
      const firstName = nameParts[0] ?? '';
      const lastName = nameParts.slice(1).join(' ');
      const provider = await this.prisma.provider.create({
        data: {
          userProfileId: sub,
          firstName,
          lastName,
          email: dto.email ?? '',
          isActive: true,
          isVerified: false,
          createdBy: sub,
        },
      });
      const hours = [
        { dayOfWeek: 1, isAvailable: true }, { dayOfWeek: 2, isAvailable: true },
        { dayOfWeek: 3, isAvailable: true }, { dayOfWeek: 4, isAvailable: true },
        { dayOfWeek: 5, isAvailable: true }, { dayOfWeek: 0, isAvailable: false },
        { dayOfWeek: 6, isAvailable: false },
      ];
      await this.prisma.workingHours.createMany({
        data: hours.map(h => ({
          providerId: provider.id,
          dayOfWeek: h.dayOfWeek,
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: h.isAvailable,
        })),
      });
    }
  }

  return profile;
}

  async me(sub: string) {
  const profile = await this.prisma.userProfile.findUnique({
    where: { id: sub },
    include: {
      patient: true,
      provider: true,
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!profile) throw new NotFoundException('Profile not found');
  return profile;
}
}
