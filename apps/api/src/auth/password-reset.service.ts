import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { NovuService } from '../novu/novu.service';
import { Wso2Service } from '../wso2/wso2.service';
import { InitiatePasswordResetDto, VerifyPasswordResetDto } from './password-reset.dto';

const OTP_TTL_MINUTES = 15;

function randomOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly novu: NovuService,
    private readonly wso2: Wso2Service,
  ) {}

  async initiate(dto: InitiatePasswordResetDto) {
    const user = await this.prisma.userProfile.findUnique({ where: { email: dto.email } });

    // Deliberately vague response either way — don't let this endpoint be
    // used to enumerate which emails have accounts. A bogus id below just
    // fails generically at verify() instead of 404ing immediately here.
    const genericResponse = {
      requestId: randomUUID(),
      message: 'If that email has an account, a reset code has been sent to it.',
    };
    if (!user) return genericResponse;

    await this.prisma.passwordResetRequest.deleteMany({ where: { userProfileId: user.id } });

    const otp = randomOtp();
    const request = await this.prisma.passwordResetRequest.create({
      data: {
        userProfileId: user.id,
        emailOtpHash: await bcrypt.hash(otp, 10),
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
      },
    });

    await this.novu.sendPasswordResetOtp({
      email: user.email,
      firstName: user.fullName?.split(' ')[0] ?? 'there',
      otp,
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(`[DEV] Password reset OTP for ${user.email}: ${otp} (request: ${request.id})`);
    }

    return { requestId: request.id, message: genericResponse.message };
  }

  async verify(requestId: string, dto: VerifyPasswordResetDto) {
    const request = await this.prisma.passwordResetRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Reset code is invalid or has expired');
    if (request.expiresAt < new Date()) {
      await this.prisma.passwordResetRequest.delete({ where: { id: requestId } });
      throw new BadRequestException('Reset code has expired. Please request a new one.');
    }

    const otpOk = await bcrypt.compare(dto.otp, request.emailOtpHash);
    if (!otpOk) throw new BadRequestException('Reset code is incorrect');

    await this.wso2.setPassword(request.userProfileId, dto.newPassword);
    await this.prisma.passwordResetRequest.delete({ where: { id: requestId } });

    this.logger.log(`Password reset completed for user ${request.userProfileId}`);
    return { success: true, message: 'Password updated. You can now log in with your new password.' };
  }
}
