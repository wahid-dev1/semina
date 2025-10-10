import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BranchDocument = Branch & Document;

@Schema({ _id: false })
export class OpeningHours {
  @Prop({ required: true, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] })
  day: string;

  @Prop()
  open: string;

  @Prop()
  close: string;

  @Prop({ default: false })
  isClosed: boolean;
}

@Schema({ _id: false })
export class Service {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['treatment', 'consultation', 'wellness', 'custom'] })
  type: string;

  @Prop({ required: true })
  maxResource: number;

  @Prop({ default: 0 })
  resourceUsed: number;

  @Prop({ default: true })
  active: boolean;
}

@Schema({ _id: false })
export class AppSettings {
  @Prop()
  logoUrl: string;

  @Prop()
  appInvitationMessage: string;

  @Prop()
  appGiftMessage: string;
}

@Schema({ _id: false })
export class CancellationPolicy {
  @Prop({ required: true })
  periodHours: number;

  @Prop({ default: true })
  penaltyApplicable: boolean;
}

@Schema({ _id: false })
export class CalendarSettings {
  @Prop({ required: true })
  timeIntervalMinutes: number;

  @Prop({ default: false })
  allowMultiServiceBooking: boolean;
}

@Schema({ timestamps: true })
export class Branch {
  @Prop({ required: true })
  branchName: string;

  @Prop({ required: true })
  contactPerson: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  timezone: string;

  @Prop({ type: [OpeningHours], default: [] })
  openingHours: OpeningHours[];

  @Prop({ type: [Service], default: [] })
  services: Service[];

  @Prop({ type: AppSettings })
  appSettings: AppSettings;

  @Prop({ type: CancellationPolicy })
  cancellationPolicy: CancellationPolicy;

  @Prop({ type: CalendarSettings })
  calendarSettings: CalendarSettings;

  @Prop({ default: true })
  enabled: boolean;

  @Prop({ default: false })
  visibleToOthers: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);
