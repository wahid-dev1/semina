import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MedicalHistoryDocument = MedicalHistory & Document;

// --- Subdocuments ---

@Schema({ _id: false })
class FieldOfApplication {
  @Prop({ type: [String], required: true })
  health: string[];

  @Prop({ type: [String], required: true })
  sportsAndFitness: string[];

  @Prop({ type: [String], required: true })
  beautyAndWellness: string[];
}

@Schema({ _id: false })
class Disease {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  hasDisease: boolean;

  @Prop()
  note?: string;
}

@Schema({ _id: false })
class HealthIssue {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  hasIssue: boolean;

  @Prop()
  note?: string;
}

@Schema({ _id: false })
class DrugImplant {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  hasDrugImplant: boolean;

  @Prop()
  note?: string;
}

// --- Main Schema ---
@Schema({ timestamps: true })
export class MedicalHistory {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;

  @Prop({ type: FieldOfApplication, required: true })
  fieldOfApplication: FieldOfApplication;

  @Prop({ default: false })
  pregnancy?: boolean;

  @Prop({ type: [Disease], default: [] })
  diseases?: Disease[];

  @Prop({ type: [HealthIssue], default: [] })
  currentAndGeneralHealthIssues?: HealthIssue[];

  @Prop({ type: [DrugImplant], default: [] })
  drugsAndImplants?: DrugImplant[];

  @Prop()
  genericNote?: string;

  @Prop({ required: true })
  termsAccepted: boolean;

  @Prop()
  signature?: string;

  @Prop({ type: Object })
  personalData: Record<string, any>;
}

export const MedicalHistorySchema = SchemaFactory.createForClass(MedicalHistory);
