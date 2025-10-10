import { IsString, IsEmail, IsDateString, IsEnum, IsBoolean, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitMedicalFormDto {
  // Personal Data
  @ApiProperty({ example: 'John' })
  @IsString()
  firstname: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastname: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '1990-01-01' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ enum: ['male', 'female', 'other'] })
  @IsEnum(['male', 'female', 'other'])
  gender: string;

  @ApiProperty({ example: '123 Main St, City, Country' })
  @IsString()
  address: string;

  @ApiProperty({ example: '60f7b3b3b3b3b3b3b3b3b3b3' })
  @IsString()
  branchId: string;

  // Medical History
  @ApiProperty({ enum: ['health', 'sports', 'wellness'] })
  @IsEnum(['health', 'sports', 'wellness'])
  fieldOfApplication: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  isPregnant: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pregnancyDetails?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  diseases?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  healthIssues?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  drugsAndImplants?: string[];

  @ApiProperty({ required: true })
  @IsBoolean()
  termsAccepted: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  signature?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  additionalNotes?: string;
}
