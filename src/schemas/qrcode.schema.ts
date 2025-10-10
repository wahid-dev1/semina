import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QRCodeDocument = QRCode & Document;

@Schema({ timestamps: true })
export class QRCode {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customerId: Types.ObjectId;

  @Prop({ default: true })
  isValid: boolean;

  @Prop()
  usedAt?: Date;

  @Prop({ required: true })
  expiresAt: Date;
}

export const QRCodeSchema = SchemaFactory.createForClass(QRCode);
