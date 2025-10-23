import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Branch, BranchDocument } from '../schemas/branch.schema';
import { Company, CompanyDocument } from '../schemas/company.schema';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { SAMINA_COMPANY_ID, SAMINA_PROVIDER_ID } from '@/common/constants/samina.constants';

const SAMINA_COMPANY_OBJECT_ID = new Types.ObjectId(SAMINA_COMPANY_ID);

@Injectable()
export class BranchesService {
  constructor(
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(createBranchDto: CreateBranchDto, _providerId: string, ipAddress: string): Promise<Branch> {
    // Verify company exists and belongs to provider
    // const company = await this.companyModel.findOne({ 
    //   _id: SAMINA_COMPANY_OBJECT_ID, 
    //   providerId: SAMINA_PROVIDER_ID,
    // }).exec();
    
    // if (!company) {
    //   throw new NotFoundException('Company not found');
    // }

    // Check if branch with same email already exists
    const existingBranch = await this.branchModel.findOne({ email: createBranchDto.email }).exec();
    if (existingBranch) {
      throw new ConflictException('Branch with this email already exists');
    }

    const branch = new this.branchModel({
      ...createBranchDto,
      companyId: SAMINA_COMPANY_OBJECT_ID,
    });
    const savedBranch = await branch.save();

    // Log creation
    await this.auditLogModel.create({
      action: 'CREATE',
      entity: 'Branch',
      entityId: savedBranch._id,
      newValues: savedBranch.toObject(),
      ipAddress,
    });

    return savedBranch;
  }

  async findAll(_providerId: string, _companyId?: string): Promise<Branch[]> {
    const filter: any = {};
    
    filter.companyId = SAMINA_COMPANY_OBJECT_ID;

    return this.branchModel.find(filter).populate('companyId', 'name').exec();
  }

  async findOne(id: string, _providerId: string): Promise<Branch> {
    const branch = await this.branchModel.findById(id).populate('companyId', 'name').exec();
    
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // // Verify branch belongs to the Samina company context
    // const belongsToSamina = branch.companyId?.toString() === SAMINA_COMPANY_ID;
    // if (!belongsToSamina) {
    //   throw new NotFoundException('Branch not found');
    // }

    return branch;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto, _providerId: string, ipAddress: string): Promise<Branch> {
    const branch = await this.branchModel.findById(id).exec();
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Verify branch remains within the Samina company context
    // const belongsToSamina = branch.companyId?.toString() === SAMINA_COMPANY_ID;
    // if (!belongsToSamina) {
    //   throw new NotFoundException('Branch not found');
    // }

    // Check if email is being changed and if it already exists
    console.log("hittt")
    if (updateBranchDto.email && updateBranchDto.email !== branch.email) {
      const existingBranch = await this.branchModel.findOne({ 
        email: updateBranchDto.email,
        _id: { $ne: id }
      }).exec();
      if (existingBranch) {
        throw new ConflictException('Branch with this email already exists');
      }
    }

    const oldValues = branch.toObject();
    Object.assign(branch, {
      ...updateBranchDto,
      companyId: SAMINA_COMPANY_OBJECT_ID,
    });
    const updatedBranch = await branch.save();

    // Log update
    await this.auditLogModel.create({
      action: 'UPDATE',
      entity: 'Branch',
      entityId: branch._id,
      oldValues,
      newValues: updatedBranch.toObject(),
      ipAddress,
    });

    return updatedBranch;
  }

  async remove(id: string, _providerId: string, ipAddress: string): Promise<void> {
    const branch = await this.branchModel.findById(id.trim()).exec();
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Verify branch belongs to Samina company context
    const belongsToSamina = branch.companyId?.toString() === SAMINA_COMPANY_ID;
    if (!belongsToSamina) {
      throw new NotFoundException('Branch not found');
    }

    // Check if branch has employees or customers
    // Note: In a real implementation, you'd check for related data here
    // For now, we'll just delete the branch

    await this.branchModel.findByIdAndDelete(id).exec();

    // Log deletion
    await this.auditLogModel.create({
      action: 'DELETE',
      entity: 'Branch',
      entityId: branch._id,
      oldValues: branch.toObject(),
      ipAddress,
    });
  }

  async getBranchStats(id: string, _providerId: string) {
    const branch = await this.findOne(id, SAMINA_PROVIDER_ID);
    
    // In a real implementation, you'd aggregate data from related collections
    // For now, return basic branch info
    return {
      branchId: (branch as any)._id.toString(),
      branchName: branch.branchName,
      totalEmployees: 0, // Would count from employees collection
      totalCustomers: 0, // Would count from customers collection
      totalOrders: 0, // Would count from orders collection
      totalRevenue: 0, // Would sum from orders collection
      lastActivity: (branch as any).updatedAt || (branch as any).createdAt,
    };
  }
}
