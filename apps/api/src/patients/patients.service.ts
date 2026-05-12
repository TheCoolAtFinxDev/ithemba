import {
  Injectable, NotFoundException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardPatientDto, UpdatePatientAddressDto } from './patients.dto';

const REGISTRATION_FEE = 67;

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userProfileId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userProfileId },
      include: {
        userProfile: true,
        savingsAccount: true,
        beneficiaries: { where: { isActive: true } },
      },
    });
    return patient;
  }

  async onboard(userProfileId: string, dto: OnboardPatientDto) {
    // Check not already onboarded
    const existing = await this.prisma.patient.findUnique({
      where: { userProfileId },
    });
    if (existing) {
      throw new ConflictException('Patient profile already exists');
    }

    // Create patient + HSA in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create patient record
      const patient = await tx.patient.create({
        data: {
          userProfileId,
          phoneNumber: dto.phoneNumber,
          nationalId: dto.nationalId,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          isActive: true,
          createdBy: userProfileId,
        },
      });

      // Create HSA
      const hsa = await tx.healthSavingsAccount.create({
        data: {
          patientId: patient.id,
          balance: 0,
          totalContributed: 0,
          totalClaimed: 0,
          isDefault: true,
          autoDebitEnabled: dto.autoDebitEnabled ?? false,
          debitSourceMpesaNumber: dto.debitSourceMpesaNumber,
          createdBy: userProfileId,
        },
      });

      // Deduct registration fee transaction record
      await tx.savingsTransaction.create({
        data: {
          accountId: hsa.id,
          patientId: patient.id,
          transactionType: 'Debit',
          amount: REGISTRATION_FEE,
          notes: 'Once-off registration fee',
          isSuccessful: true,
        },
      });

      // Log audit
      await tx.auditLogEntry.create({
        data: {
          userId: userProfileId,
          action: 'PATIENT_ONBOARDED',
          entity: 'Patient',
          entityId: patient.id,
          newValues: { phoneNumber: dto.phoneNumber },
        },
      });

      return { patient, hsa };
    });

    return result.patient;
  }

  async updateAddress(userProfileId: string, dto: UpdatePatientAddressDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { userProfileId },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    return this.prisma.patient.update({
      where: { userProfileId },
      data: {
        address: [dto.addressLine1, dto.city, dto.district, dto.country]
          .filter(Boolean)
          .join(', '),
        lastModifiedBy: userProfileId,
      },
    });
  }

  async findById(patientId: string, requestingUserId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        userProfile: true,
        savingsAccount: true,
        beneficiaries: { where: { isActive: true } },
      },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    // Patients can only view their own record
    if (patient.userProfileId !== requestingUserId) {
      const requester = await this.prisma.userRole.findFirst({
        where: {
          userProfileId: requestingUserId,
          role: { name: 'ADMIN' },
        },
        include: { role: true },
      });
      if (!requester) throw new ForbiddenException();
    }

    return patient;
  }
}
