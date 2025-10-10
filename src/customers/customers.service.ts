import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from '../schemas/customer.schema';
import { Branch, BranchDocument } from '../schemas/branch.schema';
import { MedicalHistory, MedicalHistoryDocument } from '../schemas/medical-history.schema';
import { Order, OrderDocument } from '../schemas/order.schema';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    @InjectModel(MedicalHistory.name) private medicalHistoryModel: Model<MedicalHistoryDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto, requesterId: string, ipAddress: string): Promise<Customer> {
    // Verify branch exists
    const branch = await this.branchModel.findById(createCustomerDto.branchId).exec();
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Check if customer with same email already exists in this branch
    const existingCustomer = await this.customerModel.findOne({ 
      email: createCustomerDto.email,
      branchId: createCustomerDto.branchId
    }).exec();
    if (existingCustomer) {
      throw new ConflictException('Customer with this email already exists in this branch');
    }

    const customer = new this.customerModel(createCustomerDto);
    const savedCustomer = await customer.save();

    // Log creation
    await this.auditLogModel.create({
      action: 'CREATE',
      entity: 'Customer',
      entityId: savedCustomer._id,
      employeeId: requesterId,
      branchId: createCustomerDto.branchId,
      newValues: savedCustomer.toObject(),
      ipAddress,
    });

    return savedCustomer;
  }

  async findAll(branchId?: string, search?: string): Promise<Customer[]> {
    const filter: any = {};
    
    if (branchId) {
      filter.branchId = branchId;
    }

    if (search) {
      filter.$or = [
        { firstname: { $regex: search, $options: 'i' } },
        { lastname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    return this.customerModel.find(filter)
      .populate('branchId', 'branchName')
      .populate('medicalHistoryId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerModel.findById(id)
      .populate('branchId', 'branchName')
      .populate('medicalHistoryId')
      .exec();
    
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    
    return customer;
  }

  async findByBranch(branchId: string): Promise<Customer[]> {
    return this.customerModel.find({ branchId })
      .populate('branchId', 'branchName')
      .populate('medicalHistoryId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto, requesterId: string, ipAddress: string): Promise<Customer> {
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Check if email is being changed and if it already exists in the branch
    if (updateCustomerDto.email && updateCustomerDto.email !== customer.email) {
      const existingCustomer = await this.customerModel.findOne({ 
        email: updateCustomerDto.email,
        branchId: customer.branchId,
        _id: { $ne: id }
      }).exec();
      if (existingCustomer) {
        throw new ConflictException('Customer with this email already exists in this branch');
      }
    }

    const oldValues = customer.toObject();
    Object.assign(customer, updateCustomerDto);
    const updatedCustomer = await customer.save();

    // Log update
    await this.auditLogModel.create({
      action: 'UPDATE',
      entity: 'Customer',
      entityId: customer._id,
      employeeId: requesterId,
      branchId: customer.branchId,
      oldValues,
      newValues: updatedCustomer.toObject(),
      ipAddress,
    });

    return updatedCustomer;
  }

  async remove(id: string, requesterId: string, ipAddress: string): Promise<void> {
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Check if customer has any orders
    const hasOrders = await this.orderModel.findOne({ customerId: id }).exec();
    if (hasOrders) {
      throw new ConflictException('Cannot delete customer with existing orders');
    }

    await this.customerModel.findByIdAndDelete(id).exec();

    // Log deletion
    await this.auditLogModel.create({
      action: 'DELETE',
      entity: 'Customer',
      entityId: customer._id,
      employeeId: requesterId,
      branchId: customer.branchId,
      oldValues: customer.toObject(),
      ipAddress,
    });
  }

  async getMedicalHistory(customerId: string): Promise<MedicalHistory | null> {
    const customer = await this.customerModel.findById(customerId).exec();
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (!customer.medicalHistoryId) {
      return null;
    }

    return this.medicalHistoryModel.findById(customer.medicalHistoryId).exec();
  }

  async getOrders(customerId: string): Promise<Order[]> {
    const customer = await this.customerModel.findById(customerId).exec();
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.orderModel.find({ customerId })
      .populate('productId', 'name type price')
      .populate('employeeId', 'firstname lastname')
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateLastVisit(customerId: string): Promise<void> {
    await this.customerModel.findByIdAndUpdate(customerId, { 
      lastVisit: new Date() 
    }).exec();
  }

  async getCustomerStats(customerId: string) {
    const customer = await this.findOne(customerId);
    const orders = await this.getOrders(customerId);
    
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.price, 0);
    const lastOrder = orders.length > 0 ? orders[0] : null;

    return {
      customerId: (customer as any)._id.toString(),
      customerName: `${customer.firstname} ${customer.lastname}`,
      totalOrders,
      totalSpent,
      lastVisit: customer.lastVisit,
      lastOrder: lastOrder ? {
        id: (lastOrder as any)._id.toString(),
        productName: lastOrder.productName,
        price: lastOrder.price,
        date: (lastOrder as any).createdAt
      } : null,
      hasMedicalHistory: !!customer.medicalHistoryId,
    };
  }
}
