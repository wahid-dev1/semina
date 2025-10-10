import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Branch, BranchDocument } from '../../schemas/branch.schema';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchService {
  constructor(
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
  ) {}

  async create(createBranchDto: CreateBranchDto): Promise<Branch> {
    try {
      const branch = new this.branchModel(createBranchDto);
      return await branch.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('Branch with this email already exists');
      }
      throw error;
    }
  }

  async findAll(companyId?: string): Promise<Branch[]> {
    const filter = companyId ? { companyId } : {};
    return await this.branchModel.find(filter).populate('companyId').exec();
  }

  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchModel.findById(id).populate('companyId').exec();
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    return branch;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto): Promise<Branch> {
    try {
      const branch = await this.branchModel.findByIdAndUpdate(
        id,
        updateBranchDto,
        { new: true, runValidators: true }
      ).populate('companyId').exec();

      if (!branch) {
        throw new NotFoundException('Branch not found');
      }

      return branch;
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('Branch with this email already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.branchModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Branch not found');
    }
  }

  async findByCompany(companyId: string): Promise<Branch[]> {
    return await this.branchModel.find({ companyId }).populate('companyId').exec();
  }

  async findEnabled(): Promise<Branch[]> {
    return await this.branchModel.find({ enabled: true }).populate('companyId').exec();
  }
}
