import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({ timestamps: true })
export class Customer {
  @Prop({ required: true })
  firstname: string;

  @Prop({ required: true })
  lastname: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  phone?: string;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;

  @Prop()
  lastVisit?: Date;

  @Prop({ type: Types.ObjectId, ref: 'QRCode' })
  qrCodeId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'MedicalHistory' })
  medicalHistoryId?: Types.ObjectId;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
