import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customerId: Types.ObjectId;

  @Prop({ required: true })
  customerName: string;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;

  @Prop({ required: true, enum: ['service', 'product'] })
  itemType: string;

  @Prop({ type: Types.ObjectId, ref: 'Service' })
  serviceId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product' })
  productId?: Types.ObjectId;

  @Prop({ required: true })
  itemName: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 1 })
  quantity: number;

  @Prop({ default: 0 })
  usedQuantity: number;

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ required: true })
  paymentMethod: string;

  @Prop({ required: true, enum: ['pending', 'paid', 'canceled', 'completed'], default: 'pending' })
  status: string;

  @Prop({ required: true })
  appointmentDate: Date;

  @Prop({ required: true })
  appointmentTime: string;

  @Prop({ type: Types.ObjectId, ref: 'Employee' })
  employeeId?: Types.ObjectId;

  @Prop()
  notes?: string;

  @Prop()
  serviceType?: string;
  
  @Prop()
  duration?: number;

  @Prop({ type: [Types.ObjectId], ref: 'Service', default: [] })
  includedServiceIds: Types.ObjectId[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);
