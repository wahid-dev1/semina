import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EmployeeDocument = Employee & Document;

@Schema({ timestamps: true })
export class Employee {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  firstname: string;

  @Prop({ required: true })
  lastname: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  personalPin: string;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;

  @Prop({ default: true })
  enabled: boolean;

  @Prop({ required: true, enum: ['admin', 'manager', 'operator'] })
  role: string;

  @Prop({ default: 'en' })
  language: string;

  @Prop()
  lastLogin?: Date;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
