import { IsString, IsEmail, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsMongoId, ValidateNested, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

export enum UnitSystem {
  METRIC = 'metric',
  IMPERIAL = 'imperial'
}

export enum SkinType {
  TYPE_1 = 1,
  TYPE_2 = 2,
  TYPE_3 = 3,
  TYPE_4 = 4,
  TYPE_5 = 5,
  TYPE_6 = 6
}

export class PersonalDataDto {
  @ApiProperty({ example: 'male', enum: Gender })
  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'Main Street' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @IsNotEmpty()
  houseNumber: string;

  @ApiProperty({ example: '10001' })
  @IsString()
  @IsNotEmpty()
  zip: string;

  @ApiProperty({ example: 'New York' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: '1990-01-01' })
  @IsString()
  @IsNotEmpty()
  birthday: string;

  @ApiProperty({ example: '+1-555-123-4567' })
  @IsString()
  @IsNotEmpty()
  telephone: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  mayWeContactAssurance: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsNotEmpty()
  isMinor: boolean;

  @ApiProperty({ example: 'metric', enum: UnitSystem })
  @IsEnum(UnitSystem)
  @IsNotEmpty()
  unitSystem: UnitSystem;

  @ApiProperty({ example: 70.5 })
  @IsNumber()
  @IsNotEmpty()
  bodyWeight: number;

  @ApiProperty({ example: 175 })
  @IsNumber()
  @IsNotEmpty()
  bodyHeight: number;

  @ApiProperty({ example: 3, enum: SkinType })
  @IsEnum(SkinType)
  @IsNotEmpty()
  skinType: SkinType;

  @ApiProperty({ example: 'Good' })
  @IsString()
  @IsNotEmpty()
  sleepQuality: string;

  @ApiProperty({ example: 'Moderate' })
  @IsString()
  @IsNotEmpty()
  stressLevel: string;
}

export class FieldOfApplicationDto {
  @ApiProperty({ example: ['Skin diseases', 'Arthritis'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  health: string[];

  @ApiProperty({ example: ['Weight training', 'Cardio', 'Yoga'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  sportsAndFitness: string[];

  @ApiProperty({ example: ['Facial treatments', 'Body massage', 'Sauna'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  beautyAndWellness: string[];
}

export class DiseaseDto {
  @ApiProperty({ example: 'Diabetes' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  hasDisease: boolean;

  @ApiProperty({ example: 'Type 2 diabetes diagnosed in 2020', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

export class HealthIssueDto {
  @ApiProperty({ example: 'Back pain' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  hasIssue: boolean;

  @ApiProperty({ example: 'Chronic lower back pain', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

export class DrugImplantDto {
  @ApiProperty({ example: 'Insulin pump' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  hasDrugImplant: boolean;

  @ApiProperty({ example: 'Medtronic pump model XYZ', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

export class SubmitMedicalFormDto {
  @ApiProperty({ example: '68ed4d19f065a774bc15b78d' })
  @IsMongoId()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ type: PersonalDataDto })
  @ValidateNested()
  @Type(() => PersonalDataDto)
  personalData: PersonalDataDto;

  @ApiProperty({ type: FieldOfApplicationDto })
  @ValidateNested()
  @Type(() => FieldOfApplicationDto)
  fieldOfApplication: FieldOfApplicationDto;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsNotEmpty()
  pregnancy: boolean;

  @ApiProperty({ type: [DiseaseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiseaseDto)
  diseases: DiseaseDto[];

  @ApiProperty({ type: [HealthIssueDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HealthIssueDto)
  currentAndGeneralHealthIssues: HealthIssueDto[];

  @ApiProperty({ type: [DrugImplantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DrugImplantDto)
  drugsAndImplants: DrugImplantDto[];

  @ApiProperty({ example: 'General note about medications and implants', required: false })
  @IsOptional()
  @IsString()
  genericNote?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  termsAccepted: boolean;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  digitalSignature: string;
}
