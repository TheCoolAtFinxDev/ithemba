import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsDateString, IsNotEmpty,
  IsBoolean, IsNumber, Min, Max, IsIn,
} from 'class-validator';

export class CreatePatientDto {
  @ApiProperty()
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}

export class UpdatePatientAddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;
}

export class TopUpDto {
  @ApiProperty({ description: 'Amount in ZAR (R500 - R10,000)' })
  @IsNumber()
  @Min(500)
  @Max(10000)
  amount: number;

  @ApiProperty({ enum: ['MPESA', 'CPAY'] })
  @IsIn(['MPESA', 'CPAY'])
  rail: 'MPESA' | 'CPAY';

  @ApiProperty({ description: 'Phone number to charge, e.g. 26662227190' })
  @IsString()
  mpesaPhone: string;
}

export class UpdatePatientProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}

export class AddBeneficiaryDto {
  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'Spouse' })
  @IsString()
  relationship: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class OnboardPatientDto {
  @ApiProperty()
  @IsString()
  phoneNumber: string;

  @ApiProperty({ description: 'Required — every patient must have a national ID on file' })
  @IsString()
  @IsNotEmpty()
  nationalId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoDebitEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  debitSourceMpesaNumber?: string;
}

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Hours before the appointment to send the customizable reminder (the 1-hour-before reminder is mandatory and unaffected by this setting)' })
  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(72)
  reminderAdvanceHours?: number;
}

export class SetupAutoDebitDto {
  @ApiProperty()
  @IsString()
  mpesaNumber: string;

  @ApiProperty({ description: 'Amount in ZAR, R500–R10,000' })
  @IsNumber()
  @Min(500)
  @Max(10000)
  amount: number;

  @ApiProperty({ enum: ['Weekly', 'Monthly'] })
  @IsIn(['Weekly', 'Monthly'])
  frequency: 'Weekly' | 'Monthly';
}
