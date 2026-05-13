import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';

export class SubmitClaimDto {
  @ApiProperty()
  @IsString()
  appointmentId: string;

  @ApiProperty({ description: 'Total billed amount in ZAR' })
  @IsNumber()
  @Min(1)
  totalAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfVisit?: string;
}

export class ReviewClaimDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
