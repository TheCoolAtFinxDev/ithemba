import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsBoolean, IsInt,
  IsEmail, IsArray, ValidateNested, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WorkingHoursDto {
  @ApiProperty({ description: '0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat' })
  @IsInt() @Min(0) @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '09:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  endTime: string;

  @ApiProperty()
  @IsBoolean()
  isAvailable: boolean;
}

export class ProviderAddressDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  addressLine1?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  addressLine2?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  district?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  isPrimary?: boolean;
}

export class OnboardProviderDto {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsString()
  clinicName: string;

  @ApiProperty()
  @IsString()
  specialization: string;

  @ApiProperty()
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional()
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  medicalLicenseNumber?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  mpesaMerchantCode?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  bankAccountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  ecocashNumber?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  about?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  location?: string;
}

export class UpdateProviderDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  clinicName?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  specialization?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  mpesaMerchantCode?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  bankAccountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  ecocashNumber?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  about?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  location?: string;
}

export class UpdateWorkingHoursDto {
  @ApiProperty({ type: [WorkingHoursDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHoursDto)
  hours: WorkingHoursDto[];
}

export class ProviderSearchDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  query?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  specialization?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  district?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  date?: string;
}

export class CreateTimeOffDto {
  @ApiProperty()
  @IsString()
  startUtc: string;

  @ApiProperty()
  @IsString()
  endUtc: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  reason?: string;
}
