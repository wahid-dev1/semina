import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MedicalHistoryDocument = MedicalHistory & Document;

@Schema({ timestamps: true })
export class MedicalHistory {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;

  @Prop({ required: true })
  fieldOfApplication: string;

  @Prop({ default: false })
  pregnancy?: boolean;

  @Prop({ type: [String], default: [] })
  diseases?: string[];

  @Prop({ type: [String], default: [] })
  healthIssues?: string[];

  @Prop({ type: [String], default: [] })
  drugsImplants?: string[];

  @Prop({ required: true })
  termsAccepted: boolean;

  @Prop()
  signature?: string;

  @Prop({ type: Object })
  personalData: Record<string, any>;
}

export const MedicalHistorySchema = SchemaFactory.createForClass(MedicalHistory);
