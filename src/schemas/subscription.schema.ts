import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  franchiseId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'Product', required: true })
  productIds: Types.ObjectId[];

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: true })
  active: boolean;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
