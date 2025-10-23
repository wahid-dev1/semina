import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from '../schemas/company.schema';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { SAMINA_COMPANY_ID, SAMINA_PROVIDER_ID } from '@/common/constants/samina.constants';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto, _providerId: string, ipAddress: string): Promise<Company> {
    // Check if company with same email already exists
    const existingCompany = await this.companyModel.findOne({ email: createCompanyDto.email }).exec();
    if (existingCompany) {
      throw new ConflictException('Company with this email already exists');
    }

    const existingSamina = await this.companyModel.findById(SAMINA_COMPANY_ID).exec();
    if (existingSamina) {
      throw new ConflictException('Samina company already exists');
    }

    const company = new this.companyModel({
      ...createCompanyDto,
      _id: SAMINA_COMPANY_ID,
      providerId: SAMINA_PROVIDER_ID,
    });

    const savedCompany = await company.save();

    // Log creation
    await this.auditLogModel.create({
      action: 'CREATE',
      entity: 'Company',
      entityId: savedCompany._id,
      newValues: savedCompany.toObject(),
      ipAddress,
    });

    return savedCompany;
  }

  async findAll(_providerId: string): Promise<Company[]> {
    return this.companyModel.find({ providerId: SAMINA_PROVIDER_ID }).exec();
  }

  async findOne(id: string, _providerId: string): Promise<Company> {
    const company = await this.companyModel.findOne({ _id: id, providerId: SAMINA_PROVIDER_ID }).exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto, _providerId: string, ipAddress: string): Promise<Company> {
    const company = await this.companyModel.findOne({ _id: id, providerId: SAMINA_PROVIDER_ID }).exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check if email is being changed and if it already exists
    if (updateCompanyDto.email && updateCompanyDto.email !== company.email) {
      const existingCompany = await this.companyModel.findOne({ 
        email: updateCompanyDto.email,
        _id: { $ne: id }
      }).exec();
      if (existingCompany) {
        throw new ConflictException('Company with this email already exists');
      }
    }

    const oldValues = company.toObject();
    Object.assign(company, updateCompanyDto);
    const updatedCompany = await company.save();

    // Log update
    await this.auditLogModel.create({
      action: 'UPDATE',
      entity: 'Company',
      entityId: company._id,
      oldValues,
      newValues: updatedCompany.toObject(),
      ipAddress,
    });

    return updatedCompany;
  }

  async remove(id: string, _providerId: string, ipAddress: string): Promise<void> {
    const company = await this.companyModel.findOne({ _id: id, providerId: SAMINA_PROVIDER_ID }).exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check if company has branches
    // Note: In a real implementation, you'd check for branches here
    // For now, we'll just delete the company

    await this.companyModel.findByIdAndDelete(id).exec();

    // Log deletion
    await this.auditLogModel.create({
      action: 'DELETE',
      entity: 'Company',
      entityId: company._id,
      oldValues: company.toObject(),
      ipAddress,
    });
  }
}
