import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class BookAppointmentDto {
  @ApiProperty()
  @IsUUID()
  providerId: string;

  @ApiProperty({ example: '2026-05-14T09:00:00.000Z' })
  @IsDateString()
  startUtc: string;

  @ApiProperty({ example: '2026-05-14T09:30:00.000Z' })
  @IsDateString()
  endUtc: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  beneficiaryId?: string;
}

export class CancelAppointmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RescheduleAppointmentDto {
  @ApiProperty()
  @IsDateString()
  startUtc: string;

  @ApiProperty()
  @IsDateString()
  endUtc: string;
}

export class SendOtpDto {
  @ApiPropertyOptional({ enum: ['Sms', 'Email'], default: 'Sms' })
  @IsOptional()
  @IsString()
  preferredChannel?: 'Sms' | 'Email';
}

export class VerifyVisitCodeDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  code: string;
}

export class ProviderAppointmentActionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visitCode?: string;
}
