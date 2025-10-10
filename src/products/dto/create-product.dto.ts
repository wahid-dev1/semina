import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsBoolean, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Cryotherapy Session' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Single cryotherapy session for wellness and recovery' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ['service', 'product'], example: 'service' })
  @IsEnum(['service', 'product'])
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 150.00 })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', required: false })
  @IsOptional()
  @IsMongoId()
  branchId?: string;
}
