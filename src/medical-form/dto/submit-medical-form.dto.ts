import { IsString, IsEmail, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsMongoId, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PersonalDataDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstname: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastname: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+1-555-123-4567', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '1990-01-01', required: false })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiProperty({ example: 'Male', required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ example: '123 Main St, New York, NY 10001', required: false })
  @IsOptional()
  @IsString()
  address?: string;
}

export class SubmitMedicalFormDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ type: PersonalDataDto })
  @ValidateNested()
  @Type(() => PersonalDataDto)
  personalData: PersonalDataDto;

  @ApiProperty({ example: 'Cryotherapy treatment' })
  @IsString()
  @IsNotEmpty()
  fieldOfApplication: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  pregnancy?: boolean;

  @ApiProperty({ example: ['Diabetes', 'Hypertension'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  diseases?: string[];

  @ApiProperty({ example: ['Back pain', 'Joint stiffness'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  healthIssues?: string[];

  @ApiProperty({ example: ['Insulin pump', 'Pacemaker'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  drugsImplants?: string[];

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  termsAccepted: boolean;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  signature?: string;
}
