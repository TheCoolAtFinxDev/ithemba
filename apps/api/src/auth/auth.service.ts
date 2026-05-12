import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncProfileDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async sync(sub: string, dto: SyncProfileDto) {
  // Upsert the user profile
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
      email: dto.email ?? `${sub}@wso2.local`,
      fullName: dto.fullName,
      clinicName: dto.clinicName,
      medicalLicenseNumber: dto.medicalLicenseNumber,
    },
  });

  // Assign default role if user has no roles yet
  const existingRoles = await this.prisma.userRole.count({
    where: { userProfileId: sub },
  });

  if (existingRoles === 0) {
    const roleName = dto.role ?? 'PATIENT';
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });
    if (role) {
      await this.prisma.userRole.create({
        data: { userProfileId: sub, roleId: role.id },
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
