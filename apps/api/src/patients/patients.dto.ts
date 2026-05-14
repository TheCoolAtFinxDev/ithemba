import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsDateString,
  IsBoolean, IsNumber, Min, Max,
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mpesaRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mpesaPhone?: string;
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nationalId?: string;

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
