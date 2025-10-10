import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from '../schemas/company.schema';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto, providerId: string, ipAddress: string): Promise<Company> {
    // Check if company with same email already exists
    const existingCompany = await this.companyModel.findOne({ email: createCompanyDto.email }).exec();
    if (existingCompany) {
      throw new ConflictException('Company with this email already exists');
    }

    const company = new this.companyModel({
      ...createCompanyDto,
      providerId,
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

  async findAll(providerId: string): Promise<Company[]> {
    return this.companyModel.find({ providerId }).exec();
  }

  async findOne(id: string, providerId: string): Promise<Company> {
    const company = await this.companyModel.findOne({ _id: id, providerId }).exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto, providerId: string, ipAddress: string): Promise<Company> {
    const company = await this.companyModel.findOne({ _id: id, providerId }).exec();
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

  async remove(id: string, providerId: string, ipAddress: string): Promise<void> {
    const company = await this.companyModel.findOne({ _id: id, providerId }).exec();
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
