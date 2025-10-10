import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: ['service', 'product'] })
  type: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: true })
  active: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Branch' })
  branchId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Provider' })
  providerId?: Types.ObjectId;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
