import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ServiceDocument = Service & Document;

@Schema({ timestamps: true })
export class Service {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: ['treatment', 'consultation', 'wellness', 'custom'] })
  type: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  duration: number; // in minutes

  @Prop({ default: true })
  active: boolean;

  @Prop()
  color: string;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
