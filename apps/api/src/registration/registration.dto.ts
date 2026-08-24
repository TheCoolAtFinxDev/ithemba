import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsIn, IsOptional, MinLength, Matches } from 'class-validator';

export class InitiateRegistrationDto {
  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+26650123456' })
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Invalid phone number' })
  phoneNumber: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ enum: ['PATIENT', 'PROVIDER', 'EMPLOYER'] })
  @IsIn(['PATIENT', 'PROVIDER', 'EMPLOYER'])
  role: string;

  @ApiPropertyOptional({ description: 'Company name — required when role is EMPLOYER' })
  @IsOptional()
  @IsString()
  companyName?: string;
}

export class VerifyRegistrationDto {
  @ApiProperty({ description: '6-digit email OTP' })
  @IsString()
  emailOtp: string;

  @ApiProperty({ description: '6-digit SMS OTP' })
  @IsString()
  phoneOtp: string;
}
