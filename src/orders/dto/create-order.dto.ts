import { IsString, IsNotEmpty, IsNumber, IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 150.00 })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({ enum: ['cash', 'card', 'digital_wallet', 'insurance'], example: 'card' })
  @IsEnum(['cash', 'card', 'digital_wallet', 'insurance'])
  @IsNotEmpty()
  paymentMethod: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ example: 'Cryotherapy Session', required: false })
  @IsOptional()
  @IsString()
  productName?: string;
}
