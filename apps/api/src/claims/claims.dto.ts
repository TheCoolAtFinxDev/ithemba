import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsNumber, IsDateString, Min, IsArray, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ClaimLineItemDto {
  @ApiProperty({ description: 'What was provided — a service, procedure, or medication' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  quantity?: number;

  @ApiProperty({ description: 'Price per unit in ZAR' })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

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

  @ApiPropertyOptional({
    type: [ClaimLineItemDto],
    description: 'What was provided to the patient — free-text service/product rows',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClaimLineItemDto)
  lineItems?: ClaimLineItemDto[];
}

export class EditClaimDto {
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

  @ApiPropertyOptional({ type: [ClaimLineItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClaimLineItemDto)
  lineItems?: ClaimLineItemDto[];
}

export class ReviewClaimDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
