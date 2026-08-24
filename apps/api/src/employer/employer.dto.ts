import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsNumber, IsPositive, IsArray, ValidateNested, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEmployerDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() registrationNumber?: string;
  @ApiProperty() @IsString() contactFirstName: string;
  @ApiProperty() @IsString() contactLastName: string;
  @ApiProperty() @IsEmail() contactEmail: string;
  @ApiProperty() @IsString() contactPhone: string;
  @ApiPropertyOptional({ description: 'Monthly platform fee per seat in LSL (default 50)' })
  @IsOptional() @IsNumber() @IsPositive() platformFeePerSeat?: number;
}

export class UpdateEmployerDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() registrationNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactName?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() contactEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactPhone?: string;
}

export class AddMemberDto {
  @ApiProperty({ description: 'Patient ID to enroll' }) @IsString() patientId: string;
  @ApiProperty({ description: 'Payroll reference number' }) @IsString() employeeRef: string;
  @ApiProperty({ description: 'Monthly contribution in LSL' }) @IsNumber() @IsPositive() contributionAmount: number;
}

export class UpdateMemberDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() contributionAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() employeeRef?: string;
}

export class BulkEnrollRowDto {
  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() phoneNumber: string;
  @ApiProperty({ description: 'Payroll reference number' }) @IsString() employeeRef: string;
  @ApiProperty({ description: 'Monthly contribution in LSL' }) @IsNumber() @IsPositive() contributionAmount: number;
}

export class BulkEnrollDto {
  @ApiProperty({ type: [BulkEnrollRowDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => BulkEnrollRowDto)
  rows: BulkEnrollRowDto[];
}

export class ContributionLineDto {
  @ApiProperty({ description: 'Payroll reference — must match an active membership employeeRef' })
  @IsString() employeeRef: string;

  @ApiProperty({ description: 'Contribution amount in LSL for this cycle' })
  @IsNumber() @Min(0) amount: number;
}

export class UploadContributionsDto {
  @ApiProperty({ description: 'Billing month in YYYY-MM format, e.g. 2026-07' })
  @IsString() billingMonth: string;

  @ApiProperty({ type: [ContributionLineDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => ContributionLineDto)
  contributions: ContributionLineDto[];
}

export enum EmployerPaymentMethodDto {
  Manual    = 'Manual',
  Mpesa     = 'Mpesa',
  EcoCash   = 'EcoCash',
  Card      = 'Card',
  EFT       = 'EFT',
  PaymentLink = 'PaymentLink',
  Payslip   = 'Payslip',
}

export class GenerateInvoiceDto {
  @ApiProperty({ description: 'Billing month in YYYY-MM format' })
  @IsString() billingMonth: string;

  @ApiPropertyOptional({ enum: EmployerPaymentMethodDto, default: 'Manual' })
  @IsOptional() @IsEnum(EmployerPaymentMethodDto) paymentMethod?: EmployerPaymentMethodDto;

  @ApiPropertyOptional({ description: 'Days until invoice is due (default 7)' })
  @IsOptional() @IsNumber() dueDays?: number;
}

export class ConfirmPaymentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
