import { IsString, IsEmail, IsBoolean, IsEnum, IsOptional, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'john_doe' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstname: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastname: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'Personal PIN must be 4-6 digits' })
  personalPin: string;

  @ApiProperty({ example: '60f7b3b3b3b3b3b3b3b3b3b3' })
  @IsString()
  branchId: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ enum: ['admin', 'manager', 'operator'] })
  @IsEnum(['admin', 'manager', 'operator'])
  role: string;

  @ApiProperty({ default: 'en' })
  @IsString()
  @IsOptional()
  language: string;
}
