import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from '../../schemas/customer.schema';
import { MedicalHistory, MedicalHistoryDocument } from '../../schemas/medical-history.schema';
import { QRCode, QRCodeDocument } from '../../schemas/qrcode.schema';
import { SubmitMedicalFormDto } from './dto/submit-medical-form.dto';
import * as crypto from 'crypto';

@Injectable()
export class MedicalFormService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(MedicalHistory.name) private medicalHistoryModel: Model<MedicalHistoryDocument>,
    @InjectModel(QRCode.name) private qrCodeModel: Model<QRCodeDocument>,
  ) {}

  async submitForm(submitMedicalFormDto: SubmitMedicalFormDto): Promise<{ customer: Customer; qrCode: string }> {
    try {
      // Create customer
      const customerData = {
        firstname: submitMedicalFormDto.firstname,
        lastname: submitMedicalFormDto.lastname,
        email: submitMedicalFormDto.email,
        phone: submitMedicalFormDto.phone,
        dateOfBirth: new Date(submitMedicalFormDto.dateOfBirth),
        gender: submitMedicalFormDto.gender,
        address: submitMedicalFormDto.address,
        branchId: submitMedicalFormDto.branchId,
        enabled: true,
      };

      const customer = new this.customerModel(customerData);
      await customer.save();

      // Create medical history
      const medicalHistoryData = {
        customerId: customer._id,
        fieldOfApplication: submitMedicalFormDto.fieldOfApplication,
        isPregnant: submitMedicalFormDto.isPregnant,
        pregnancyDetails: submitMedicalFormDto.pregnancyDetails,
        diseases: submitMedicalFormDto.diseases || [],
        healthIssues: submitMedicalFormDto.healthIssues || [],
        drugsAndImplants: submitMedicalFormDto.drugsAndImplants || [],
        termsAccepted: submitMedicalFormDto.termsAccepted,
        signature: submitMedicalFormDto.signature,
        additionalNotes: submitMedicalFormDto.additionalNotes,
      };

      const medicalHistory = new this.medicalHistoryModel(medicalHistoryData);
      await medicalHistory.save();

      // Update customer with medical history reference
      customer.medicalHistoryId = medicalHistory._id as any;
      await customer.save();

      // Generate QR code
      const qrCodeString = this.generateQRCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 7 days

      const qrCode = new this.qrCodeModel({
        code: qrCodeString,
        customerId: customer._id,
        isValid: true,
        expiresAt,
      });

      await qrCode.save();

      // Update customer with QR code reference
      customer.qrCodeId = qrCode._id.toString();
      await customer.save();

      return { customer, qrCode: qrCodeString };
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('Customer with this email already exists');
      }
      throw new BadRequestException('Failed to submit medical form');
    }
  }

  async getFormOptions(): Promise<any> {
    return {
      fieldOfApplication: ['health', 'sports', 'wellness'],
      gender: ['male', 'female', 'other'],
      commonDiseases: [
        'Diabetes',
        'Hypertension',
        'Heart Disease',
        'Asthma',
        'Arthritis',
        'Cancer',
        'Depression',
        'Anxiety',
        'Other'
      ],
      commonHealthIssues: [
        'Chronic Pain',
        'Sleep Disorders',
        'Digestive Issues',
        'Skin Problems',
        'Allergies',
        'Migraines',
        'Other'
      ]
    };
  }

  private generateQRCode(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
