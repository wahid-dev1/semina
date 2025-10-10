import { IsString, IsNumber, IsEnum, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Cryotherapy Session' })
  @IsString()
  name: string;

  @ApiProperty({ example: '30-minute cryotherapy treatment', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['service', 'product'] })
  @IsEnum(['service', 'product'])
  type: string;

  @ApiProperty({ example: 150.00 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  active: boolean;

  @ApiProperty({ example: '60f7b3b3b3b3b3b3b3b3b3b3', required: false })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiProperty({ example: '60f7b3b3b3b3b3b3b3b3b3b3', required: false })
  @IsOptional()
  @IsString()
  companyId?: string;
}
