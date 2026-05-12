import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class SyncProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiProperty({ enum: ['PATIENT', 'PROVIDER', 'ADMIN'] })
  @IsIn(['PATIENT', 'PROVIDER', 'ADMIN'])
  role: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clinicName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  medicalLicenseNumber?: string;
}