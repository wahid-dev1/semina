import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsBoolean, IsMongoId, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'Cryotherapy Session' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Single cryotherapy session for wellness and recovery' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ['treatment', 'consultation', 'wellness', 'custom'], example: 'treatment' })
  @IsEnum(['treatment', 'consultation', 'wellness', 'custom'])
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 150.00 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ example: 30, description: 'Duration in minutes' })
  @IsNumber()
  @IsPositive()
  duration: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ example: '#FF5733', required: false })
  @IsOptional()
  @IsString()
  color?: string;
}
