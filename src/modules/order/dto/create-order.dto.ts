import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ example: '60f7b3b3b3b3b3b3b3b3b3b3' })
  @IsString()
  customerId: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  customerName: string;

  @ApiProperty({ example: '60f7b3b3b3b3b3b3b3b3b3b3' })
  @IsString()
  branchId: string;

  @ApiProperty({ example: '60f7b3b3b3b3b3b3b3b3b3b3' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 'Cryotherapy Session' })
  @IsString()
  productName: string;

  @ApiProperty({ example: 150.00 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ enum: ['cash', 'card', 'bank_transfer', 'qr_payment'] })
  @IsEnum(['cash', 'card', 'bank_transfer', 'qr_payment'])
  paymentMethod: string;

  @ApiProperty({ enum: ['pending', 'paid', 'canceled'], default: 'pending' })
  @IsEnum(['pending', 'paid', 'canceled'])
  status: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
