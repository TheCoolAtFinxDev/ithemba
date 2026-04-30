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
        role: dto.role,
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

    return profile;
  }

  async me(sub: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { id: sub },
      include: {
        patient: true,
        provider: true,
      },
    });

    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }
}
