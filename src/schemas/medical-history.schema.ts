import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MedicalHistoryDocument = MedicalHistory & Document;

@Schema({ timestamps: true })
export class MedicalHistory {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customerId: Types.ObjectId;

  @Prop({ required: true })
  fieldOfApplication: string;

  @Prop({ default: false })
  isPregnant: boolean;

  @Prop()
  pregnancyDetails?: string;

  @Prop({ type: [String] })
  diseases: string[];

  @Prop({ type: [String] })
  healthIssues: string[];

  @Prop({ type: [String] })
  drugsAndImplants: string[];

  @Prop({ required: true })
  termsAccepted: boolean;

  @Prop()
  signature?: string;

  @Prop()
  additionalNotes?: string;
}

export const MedicalHistorySchema = SchemaFactory.createForClass(MedicalHistory);
