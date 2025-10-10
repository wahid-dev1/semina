import { IsString, IsEmail, IsNotEmpty, IsOptional, IsBoolean, IsArray, ValidateNested, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OpeningHoursDto {
  @ApiProperty({ enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] })
  @IsEnum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
  @IsNotEmpty()
  day: string;

  @ApiProperty({ example: '08:00', required: false })
  @IsOptional()
  @IsString()
  open?: string;

  @ApiProperty({ example: '18:00', required: false })
  @IsOptional()
  @IsString()
  close?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;
}

export class ServiceDto {
  @ApiProperty({ example: 'Cryotherapy' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ['treatment', 'consultation', 'wellness', 'custom'] })
  @IsEnum(['treatment', 'consultation', 'wellness', 'custom'])
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @IsNotEmpty()
  maxResource: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  resourceUsed?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class AppSettingsDto {
  @ApiProperty({ example: 'https://cdn.example.com/logo.png', required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ example: 'Welcome to WellCare!', required: false })
  @IsOptional()
  @IsString()
  appInvitationMessage?: string;

  @ApiProperty({ example: 'Enjoy your first session on us!', required: false })
  @IsOptional()
  @IsString()
  appGiftMessage?: string;
}

export class CancellationPolicyDto {
  @ApiProperty({ example: 24 })
  @IsNumber()
  @IsNotEmpty()
  periodHours: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  penaltyApplicable?: boolean;
}

export class CalendarSettingsDto {
  @ApiProperty({ example: 30 })
  @IsNumber()
  @IsNotEmpty()
  timeIntervalMinutes: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  allowMultiServiceBooking?: boolean;
}

export class CreateBranchDto {
  @ApiProperty({ example: 'WellCare Berlin' })
  @IsString()
  @IsNotEmpty()
  branchName: string;

  @ApiProperty({ example: 'Dr. Anna Meier' })
  @IsString()
  @IsNotEmpty()
  contactPerson: string;

  @ApiProperty({ example: 'Kurfürstendamm 123, 10711 Berlin, Germany' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: '+49 30 123456' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'berlin@wellcare.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Europe/Berlin' })
  @IsString()
  @IsNotEmpty()
  timezone: string;

  @ApiProperty({ type: [OpeningHoursDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpeningHoursDto)
  openingHours?: OpeningHoursDto[];

  @ApiProperty({ type: [ServiceDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  services?: ServiceDto[];

  @ApiProperty({ type: AppSettingsDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => AppSettingsDto)
  appSettings?: AppSettingsDto;

  @ApiProperty({ type: CancellationPolicyDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CancellationPolicyDto)
  cancellationPolicy?: CancellationPolicyDto;

  @ApiProperty({ type: CalendarSettingsDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CalendarSettingsDto)
  calendarSettings?: CalendarSettingsDto;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  visibleToOthers?: boolean;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  companyId: string;
}
