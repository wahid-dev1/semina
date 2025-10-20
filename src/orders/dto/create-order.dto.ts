import { IsString, IsNotEmpty, IsNumber, IsEnum, IsMongoId, IsOptional, IsPositive, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ 
    enum: ['service', 'product'], 
    example: 'service',
    description: 'service = direct service purchase, product = bundle purchase'
  })
  @IsEnum(['service', 'product'])
  @IsNotEmpty()
  itemType: string;

  @ApiProperty({ 
    example: '507f1f77bcf86cd799439011', 
    required: false,
    description: 'Required for service type items'
  })
  @IsOptional()
  @IsMongoId()
  serviceId?: string;

  @ApiProperty({ 
    example: '507f1f77bcf86cd799439011', 
    required: false,
    description: 'Required for product type items'
  })
  @IsOptional()
  @IsMongoId()
  productId?: string;

  @ApiProperty({ 
    example: 'Cryotherapy Session',
    description: 'Service name for service type, product name for product type'
  })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiProperty({ 
    example: 150.00,
    description: 'Price will be validated against branch service price or product price'
  })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ enum: ['cash', 'card', 'digital_wallet', 'insurance'], example: 'card' })
  @IsEnum(['cash', 'card', 'digital_wallet', 'insurance'])
  @IsNotEmpty()
  paymentMethod: string;

  @ApiProperty({ example: '2024-01-15', description: 'Appointment date' })
  @IsDateString()
  @IsNotEmpty()
  appointmentDate: string;

  @ApiProperty({ example: '14:30', description: 'Appointment time in HH:MM format' })
  @IsString()
  @IsNotEmpty()
  appointmentTime: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ example: 'Special instructions for this order', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
