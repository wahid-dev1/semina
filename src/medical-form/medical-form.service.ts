import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { Customer, CustomerDocument } from '../schemas/customer.schema';
import { Branch, BranchDocument } from '../schemas/branch.schema';
import { MedicalHistory, MedicalHistoryDocument } from '../schemas/medical-history.schema';
import { QRCode, QRCodeDocument } from '../schemas/qr-code.schema';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';
import { SubmitMedicalFormDto } from './dto/submit-medical-form.dto';

@Injectable()
export class MedicalFormService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    @InjectModel(MedicalHistory.name) private medicalHistoryModel: Model<MedicalHistoryDocument>,
    @InjectModel(QRCode.name) private qrCodeModel: Model<QRCodeDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async submitForm(submitMedicalFormDto: SubmitMedicalFormDto, ipAddress: string): Promise<{
    customer: Customer;
    qrCode: string;
    message: string;
  }> {
    // Verify branch exists and is enabled
    const branch = await this.branchModel.findOne({ 
      _id: submitMedicalFormDto.branchId, 
      enabled: true 
    }).exec();
    
    if (!branch) {
      throw new NotFoundException('Branch not found or disabled');
    }

    // Check if customer with same email already exists in this branch
    const existingCustomer = await this.customerModel.findOne({ 
      email: submitMedicalFormDto.personalData.email,
      branchId: submitMedicalFormDto.branchId
    }).exec();
    
    if (existingCustomer) {
      throw new ConflictException('Customer with this email already exists in this branch');
    }

    // Create customer
    const customer = new this.customerModel({
      firstname: submitMedicalFormDto.personalData.firstname,
      lastname: submitMedicalFormDto.personalData.lastname,
      email: submitMedicalFormDto.personalData.email,
      phone: submitMedicalFormDto.personalData.phone,
      branchId: submitMedicalFormDto.branchId,
    });

    const savedCustomer = await customer.save();

    // Create medical history
    const medicalHistory = new this.medicalHistoryModel({
      customerId: savedCustomer._id,
      branchId: submitMedicalFormDto.branchId,
      fieldOfApplication: submitMedicalFormDto.fieldOfApplication,
      pregnancy: submitMedicalFormDto.pregnancy,
      diseases: submitMedicalFormDto.diseases || [],
      healthIssues: submitMedicalFormDto.healthIssues || [],
      drugsImplants: submitMedicalFormDto.drugsImplants || [],
      termsAccepted: submitMedicalFormDto.termsAccepted,
      signature: submitMedicalFormDto.signature,
      personalData: submitMedicalFormDto.personalData,
    });

    const savedMedicalHistory = await medicalHistory.save();

    // Update customer with medical history reference
    savedCustomer.medicalHistoryId = savedMedicalHistory._id as any;
    await savedCustomer.save();

    // Generate QR code for one-time login
    const qrCode = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const qrCodeDoc = new this.qrCodeModel({
      code: qrCode,
      customerId: savedCustomer._id,
      branchId: submitMedicalFormDto.branchId,
      expiresAt,
    });

    await qrCodeDoc.save();

    // Update customer with QR code reference
    savedCustomer.qrCodeId = qrCodeDoc._id as any;
    await savedCustomer.save();

    // Log form submission
    await this.auditLogModel.create({
      action: 'MEDICAL_FORM_SUBMIT',
      entity: 'Customer',
      entityId: savedCustomer._id,
      customerId: savedCustomer._id,
      branchId: submitMedicalFormDto.branchId,
      newValues: {
        customer: savedCustomer.toObject(),
        medicalHistory: savedMedicalHistory.toObject(),
        qrCode: qrCode
      },
      ipAddress,
    });

    return {
      customer: savedCustomer,
      qrCode,
      message: 'Medical form submitted successfully. Please use the QR code to log in to your account.'
    };
  }

  async getFormOptions(): Promise<{
    branches: Array<{ id: string; name: string; address: string; phone: string; email: string }>;
    fieldOfApplicationOptions: string[];
    diseaseOptions: string[];
    healthIssueOptions: string[];
    drugImplantOptions: string[];
  }> {
    // Get all enabled branches
    const branches = await this.branchModel.find({ enabled: true })
      .select('branchName address phone email')
      .exec();

    const branchOptions = branches.map(branch => ({
      id: branch._id.toString(),
      name: branch.branchName,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
    }));

    // These would typically come from a configuration or database
    const fieldOfApplicationOptions = [
      'Cryotherapy treatment',
      'Wellness consultation',
      'Physical therapy',
      'Massage therapy',
      'Sauna therapy',
      'Other'
    ];

    const diseaseOptions = [
      'Diabetes',
      'Hypertension',
      'Heart disease',
      'Asthma',
      'Arthritis',
      'Cancer',
      'Epilepsy',
      'Other'
    ];

    const healthIssueOptions = [
      'Back pain',
      'Joint stiffness',
      'Muscle tension',
      'Stress',
      'Insomnia',
      'Headaches',
      'Circulation problems',
      'Other'
    ];

    const drugImplantOptions = [
      'Insulin pump',
      'Pacemaker',
      'Joint replacement',
      'Dental implants',
      'Hearing aid',
      'Other'
    ];

    return {
      branches: branchOptions,
      fieldOfApplicationOptions,
      diseaseOptions,
      healthIssueOptions,
      drugImplantOptions,
    };
  }

  async validateQRCode(qrCode: string): Promise<boolean> {
    const qr = await this.qrCodeModel.findOne({ 
      code: qrCode, 
      isValid: true,
      expiresAt: { $gt: new Date() }
    }).exec();

    return !!qr;
  }

  async getCustomerByQRCode(qrCode: string): Promise<Customer | null> {
    const qr = await this.qrCodeModel.findOne({ 
      code: qrCode, 
      isValid: true,
      expiresAt: { $gt: new Date() }
    }).populate('customerId').exec();

    if (!qr || !qr.customerId) {
      return null;
    }

    return qr.customerId as any;
  }
}
