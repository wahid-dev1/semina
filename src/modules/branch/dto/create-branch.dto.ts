import { IsString, IsEmail, IsBoolean, IsArray, IsOptional, ValidateNested, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OpeningHoursDto {
  @ApiProperty({ enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] })
  @IsString()
  day: string;

  @ApiProperty({ required: false, example: '08:00' })
  @IsOptional()
  @IsString()
  open?: string;

  @ApiProperty({ required: false, example: '18:00' })
  @IsOptional()
  @IsString()
  close?: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  isClosed: boolean;
}

export class ServiceDto {
  @ApiProperty({ example: 'Cryotherapy' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ['treatment', 'consultation', 'wellness', 'custom'] })
  @IsString()
  type: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(1)
  maxResource: number;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  resourceUsed: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  active: boolean;
}

export class AppSettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  appInvitationMessage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  appGiftMessage?: string;
}

export class CancellationPolicyDto {
  @ApiProperty({ example: 24 })
  @IsNumber()
  @Min(1)
  @Max(168) // Max 7 days
  periodHours: number;

  @ApiProperty({ default: false })
  @IsBoolean()
  penaltyApplicable: boolean;
}

export class CalendarSettingsDto {
  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(5)
  @Max(120)
  timeIntervalMinutes: number;

  @ApiProperty({ default: false })
  @IsBoolean()
  allowMultiServiceBooking: boolean;
}

export class CreateBranchDto {
  @ApiProperty({ example: 'WellCare Berlin' })
  @IsString()
  branchName: string;

  @ApiProperty({ example: 'Dr. Anna Meier' })
  @IsString()
  contactPerson: string;

  @ApiProperty({ example: 'Kurfürstendamm 123, 10711 Berlin, Germany' })
  @IsString()
  address: string;

  @ApiProperty({ example: '+49 30 123456' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'berlin@wellcare.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Europe/Berlin' })
  @IsString()
  timezone: string;

  @ApiProperty({ type: [OpeningHoursDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpeningHoursDto)
  openingHours: OpeningHoursDto[];

  @ApiProperty({ type: [ServiceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  services: ServiceDto[];

  @ApiProperty({ type: AppSettingsDto })
  @ValidateNested()
  @Type(() => AppSettingsDto)
  appSettings: AppSettingsDto;

  @ApiProperty({ type: CancellationPolicyDto })
  @ValidateNested()
  @Type(() => CancellationPolicyDto)
  cancellationPolicy: CancellationPolicyDto;

  @ApiProperty({ type: CalendarSettingsDto })
  @ValidateNested()
  @Type(() => CalendarSettingsDto)
  calendarSettings: CalendarSettingsDto;

  @ApiProperty({ default: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  visibleToOthers: boolean;

  @ApiProperty({ example: '60f7b3b3b3b3b3b3b3b3b3b3' })
  @IsString()
  companyId: string;
}
