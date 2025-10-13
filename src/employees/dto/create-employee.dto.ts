import { IsString, IsEmail, IsNotEmpty, IsOptional, IsBoolean, IsEnum, MinLength, Matches, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'john.doe' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstname: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastname: string;

  @ApiProperty({ example: 'john.doe@wellcare.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}$/, { message: 'Personal PIN must be exactly 4 digits' })
  personalPin: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', required: false })
  @ValidateIf((employee) => employee.role !== 'super-admin')
  @IsString()
  @IsNotEmpty()
  branchId?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty({ enum: ['super-admin', 'admin', 'manager', 'operator'] })
  @IsEnum(['super-admin', 'admin', 'manager', 'operator'])
  @IsNotEmpty()
  role: string;

  @ApiProperty({ example: 'en', required: false })
  @IsOptional()
  @IsString()
  language?: string;
}
