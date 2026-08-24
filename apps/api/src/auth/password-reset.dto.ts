import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class InitiatePasswordResetDto {
  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  email: string;
}

export class VerifyPasswordResetDto {
  @ApiProperty({ description: '6-digit email OTP' })
  @IsString()
  otp: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
