import {
  Injectable, Logger, BadRequestException, ConflictException, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NovuService } from '../novu/novu.service';
import { Wso2Service } from '../wso2/wso2.service';
import { AuthService } from '../auth/auth.service';
import { InitiateRegistrationDto, VerifyRegistrationDto } from './registration.dto';
import * as bcrypt from 'bcryptjs';

const OTP_TTL_MINUTES = 30;

function randomOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly novu: NovuService,
    private readonly wso2: Wso2Service,
    private readonly authService: AuthService,
  ) {}

  async initiate(dto: InitiateRegistrationDto) {
    if (dto.role === 'EMPLOYER' && !dto.companyName?.trim()) {
      throw new BadRequestException('Company name is required for employer registration');
    }

    // Block if email already in UserProfile
    const existing = await this.prisma.userProfile.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('An account with this email already exists');

    // Remove any previous unverified attempts for same email
    await this.prisma.pendingRegistration.deleteMany({ where: { email: dto.email } });

    const emailOtp = randomOtp();
    const phoneOtp = randomOtp();

    const pending = await this.prisma.pendingRegistration.create({
      data: {
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        companyName: dto.role === 'EMPLOYER' ? dto.companyName : null,
        emailOtpHash: await bcrypt.hash(emailOtp, 10),
        phoneOtpHash: await bcrypt.hash(phoneOtp, 10),
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
      },
    });

    await this.novu.sendEmailOtp({
      email: dto.email,
      firstName: dto.firstName,
      otp: emailOtp,
      pendingId: pending.id,
    });

    // Send SMS OTP via Novu → Vomule custom provider
    await this.novu.sendSmsOtp({
      phoneNumber: dto.phoneNumber,
      firstName: dto.firstName,
      otp: phoneOtp,
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(`[DEV] Email OTP: ${emailOtp}  SMS OTP: ${phoneOtp}  (pending: ${pending.id})`);
    }

    return {
      pendingId: pending.id,
      expiresAt: pending.expiresAt,
      message: 'OTP codes sent to your email and phone number',
    };
  }

  async verify(pendingId: string, dto: VerifyRegistrationDto) {
    const pending = await this.prisma.pendingRegistration.findUnique({ where: { id: pendingId } });
    if (!pending) throw new NotFoundException('Registration session not found or already completed');
    if (pending.expiresAt < new Date()) {
      await this.prisma.pendingRegistration.delete({ where: { id: pendingId } });
      throw new BadRequestException('OTP codes have expired. Please register again.');
    }

    const emailOk = pending.emailVerified || await bcrypt.compare(dto.emailOtp, pending.emailOtpHash);
    const phoneOk = pending.phoneVerified || await bcrypt.compare(dto.phoneOtp, pending.phoneOtpHash);

    if (!emailOk && !phoneOk) throw new BadRequestException('Both OTP codes are incorrect');
    if (!emailOk) throw new BadRequestException('Email OTP is incorrect');
    if (!phoneOk) throw new BadRequestException('Phone OTP is incorrect');

    // Create WSO2 user (returns id + temporaryPassword)
    const { id: wso2UserId, temporaryPassword } = await this.wso2.createUser({
      email: pending.email,
      firstName: pending.firstName,
      lastName: pending.lastName,
      phoneNumber: pending.phoneNumber,
    });

    // Assign group (PATIENT or PROVIDER)
    await this.wso2.assignGroup(wso2UserId, pending.role, pending.email);

    // Pre-create local UserProfile so first login is instant
    await this.authService.sync(wso2UserId, {
      email: pending.email,
      fullName: `${pending.firstName} ${pending.lastName}`,
      role: pending.role,
    });

    // Create the role-specific record
    if (pending.role === 'EMPLOYER') {
      await this.prisma.employer.create({
        data: {
          name: pending.companyName ?? `${pending.firstName} ${pending.lastName}'s Company`,
          contactName: `${pending.firstName} ${pending.lastName}`,
          contactEmail: pending.email,
          contactPhone: pending.phoneNumber,
          contactUserProfileId: wso2UserId,
          isVerified: false,
          isActive: true,
          createdBy: wso2UserId,
        },
      });
    }

    // Send welcome email with temporary password
    await this.novu.sendWelcome({
      email: pending.email,
      firstName: pending.firstName,
      temporaryPassword,
      loginUrl: 'https://myhealth.ithembahealth.com',
    });

    // Clean up
    await this.prisma.pendingRegistration.delete({ where: { id: pendingId } });

    this.logger.log(`Registration complete: ${pending.email} as ${pending.role} (wso2: ${wso2UserId})`);

    return {
      success: true,
      message: 'Account created. You can now log in.',
    };
  }

  // Public lookup so the registration form can prefill + lock fields when a
  // user arrives via an employer bulk-enrollment invite link.
  async getEmployerInvite(token: string) {
    const invite = await this.prisma.employerInvite.findUnique({
      where: { token },
      include: { employer: { select: { name: true } } },
    });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.status !== 'Pending') throw new BadRequestException('This invite has already been used or cancelled');
    if (invite.expiresAt < new Date()) throw new BadRequestException('This invite has expired. Ask your employer to resend it.');

    return {
      firstName: invite.firstName,
      lastName: invite.lastName,
      email: invite.email,
      phoneNumber: invite.phoneNumber,
      employerName: invite.employer.name,
    };
  }

  async resend(pendingId: string) {
    const pending = await this.prisma.pendingRegistration.findUnique({ where: { id: pendingId } });
    if (!pending) throw new NotFoundException('Registration session not found');
    if (pending.expiresAt < new Date()) throw new BadRequestException('Session expired. Please register again.');

    const emailOtp = randomOtp();
    const phoneOtp = randomOtp();

    await this.prisma.pendingRegistration.update({
      where: { id: pendingId },
      data: {
        emailOtpHash: await bcrypt.hash(emailOtp, 10),
        phoneOtpHash: await bcrypt.hash(phoneOtp, 10),
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
      },
    });

    await this.novu.sendEmailOtp({ email: pending.email, firstName: pending.firstName, otp: emailOtp, pendingId });
    await this.novu.sendSmsOtp({ phoneNumber: pending.phoneNumber, firstName: pending.firstName, otp: phoneOtp });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(`[DEV] Resent — Email OTP: ${emailOtp}  SMS OTP: ${phoneOtp}`);
    }

    return { message: 'OTP codes resent' };
  }

  // ── Admin support: unblock a stuck registration ───────────────

  async listPending() {
    return this.prisma.pendingRegistration.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async adminVerifyPhone(adminUserId: string, pendingId: string) {
    const pending = await this.prisma.pendingRegistration.findUnique({ where: { id: pendingId } });
    if (!pending) throw new NotFoundException('Pending registration not found');

    await this.prisma.pendingRegistration.update({
      where: { id: pendingId },
      data: { phoneVerified: true },
    });

    await this.prisma.auditLogEntry.create({
      data: {
        userId: adminUserId,
        action: 'PENDING_REGISTRATION_PHONE_FORCE_VERIFIED',
        entity: 'PendingRegistration',
        entityId: pendingId,
        newValues: { email: pending.email, phoneNumber: pending.phoneNumber },
      },
    });

    return { message: 'Phone marked as verified. The user can now complete registration with just their email code.' };
  }
}
