import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Service, ServiceDocument } from '../schemas/service.schema';
import { Branch, BranchDocument } from '../schemas/branch.schema';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(createServiceDto: CreateServiceDto, requesterId: string, ipAddress: string): Promise<Service> {
    // Verify branch exists
    const branch = await this.branchModel.findById(createServiceDto.branchId).exec();
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Check if service with same name already exists in the same branch
    const existingService = await this.serviceModel.findOne({
      name: createServiceDto.name,
      branchId: createServiceDto.branchId
    }).exec();

    if (existingService) {
      throw new ConflictException('Service with this name already exists in this branch');
    }

    const service = new this.serviceModel(createServiceDto);
    const savedService = await service.save();

    // Log creation
    await this.auditLogModel.create({
      action: 'CREATE',
      entity: 'Service',
      entityId: savedService._id,
      employeeId: requesterId,
      branchId: createServiceDto.branchId,
      newValues: savedService.toObject(),
      ipAddress,
    });

    return savedService;
  }

  async findAll(branchId?: string, type?: string, active?: boolean): Promise<Service[]> {
    const filter: any = {};
    
    if (branchId) {
      filter.branchId = new mongoose.Types.ObjectId(branchId);
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (active !== undefined) {
      filter.active = active;
    }

    return this.serviceModel.find(filter)
      .populate('branchId', 'branchName')
      .sort({ name: 1 })
      .exec();
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceModel.findById(id)
      .populate('branchId', 'branchName')
      .exec();
    
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    
    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto, requesterId: string, ipAddress: string): Promise<Service> {
    const service = await this.serviceModel.findById(id).exec();
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // If branchId is being changed, verify new branch exists
    if (updateServiceDto.branchId && updateServiceDto.branchId !== service.branchId.toString()) {
      const branch = await this.branchModel.findById(updateServiceDto.branchId).exec();
      if (!branch) {
        throw new NotFoundException('Branch not found');
      }
    }

    // Check if name is being changed and if it already exists in the same branch
    if (updateServiceDto.name && updateServiceDto.name !== service.name) {
      const existingService = await this.serviceModel.findOne({
        name: updateServiceDto.name,
        _id: { $ne: id },
        branchId: updateServiceDto.branchId || service.branchId
      }).exec();
      
      if (existingService) {
        throw new ConflictException('Service with this name already exists in this branch');
      }
    }

    const oldValues = service.toObject();
    Object.assign(service, updateServiceDto);
    const updatedService = await service.save();

    // Log update
    await this.auditLogModel.create({
      action: 'UPDATE',
      entity: 'Service',
      entityId: service._id,
      employeeId: requesterId,
      branchId: service.branchId,
      oldValues,
      newValues: updatedService.toObject(),
      ipAddress,
    });

    return updatedService;
  }

  async remove(id: string, requesterId: string, ipAddress: string): Promise<void> {
    const service = await this.serviceModel.findById(id).exec();
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Check if service is being used in any products or branches
    // Note: In a real implementation, you'd check for related products/branches here
    // For now, we'll just delete the service

    await this.serviceModel.findByIdAndDelete(id).exec();

    // Log deletion
    await this.auditLogModel.create({
      action: 'DELETE',
      entity: 'Service',
      entityId: service._id,
      employeeId: requesterId,
      branchId: service.branchId,
      oldValues: service.toObject(),
      ipAddress,
    });
  }

  async toggleStatus(id: string, requesterId: string, ipAddress: string): Promise<Service> {
    const service = await this.serviceModel.findById(id).exec();
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const oldValues = service.toObject();
    service.active = !service.active;
    const updatedService = await service.save();

    // Log status change
    await this.auditLogModel.create({
      action: service.active ? 'ACTIVATE' : 'DEACTIVATE',
      entity: 'Service',
      entityId: service._id,
      employeeId: requesterId,
      branchId: service.branchId,
      oldValues,
      newValues: updatedService.toObject(),
      ipAddress,
    });

    return updatedService;
  }

  async getServiceStats(branchId?: string) {
    const filter = branchId ? { branchId } : {};
    
    const services = await this.serviceModel.find(filter).exec();
    
    const totalServices = services.length;
    const activeServices = services.filter(s => s.active).length;
    const inactiveServices = services.filter(s => !s.active).length;
    
    const servicesByType = services.reduce((acc, service) => {
      acc[service.type] = (acc[service.type] || 0) + 1;
      return acc;
    }, {});

    const averagePrice = services.length > 0 
      ? services.reduce((sum, service) => sum + service.price, 0) / services.length 
      : 0;

    return {
      totalServices,
      activeServices,
      inactiveServices,
      servicesByType,
      averagePrice,
      priceRange: {
        min: services.length > 0 ? Math.min(...services.map(s => s.price)) : 0,
        max: services.length > 0 ? Math.max(...services.map(s => s.price)) : 0,
      }
    };
  }
}
