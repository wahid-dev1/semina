import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { Customer, CustomerDocument } from '../schemas/customer.schema';
import { Branch, BranchDocument } from '../schemas/branch.schema';
import { MedicalHistory, MedicalHistoryDocument } from '../schemas/medical-history.schema';
import { Order, OrderDocument } from '../schemas/order.schema';
import { QRCode, QRCodeDocument } from '../schemas/qr-code.schema';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    @InjectModel(MedicalHistory.name) private medicalHistoryModel: Model<MedicalHistoryDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(QRCode.name) private qrCodeModel: Model<QRCodeDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}


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
      .populate('serviceId', 'name type price duration')
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
    const totalSpent = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const lastOrder = orders.length > 0 ? orders[0] : null;

    return {
      customerId: (customer as any)._id.toString(),
      customerName: `${customer.firstname} ${customer.lastname}`,
      totalOrders,
      totalSpent,
      lastVisit: customer.lastVisit,
      lastOrder: lastOrder ? {
        id: (lastOrder as any)._id.toString(),
        itemName: lastOrder.itemName,
        price: lastOrder.price,
        quantity: lastOrder.quantity,
        totalPrice: lastOrder.totalPrice,
        date: (lastOrder as any).createdAt
      } : null,
      hasMedicalHistory: !!customer.medicalHistoryId,
    };
  }

  async generateQRCode(customerId: string, branchId: string, requesterId: string, ipAddress: string): Promise<{
    qrCode: string;
    expiresAt: Date;
    message: string;
  }> {
    // Verify customer exists
    const customer = await this.customerModel.findById(customerId).exec();
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Verify branch exists and is enabled
    const branch = await this.branchModel.findOne({ 
      _id: branchId, 
      enabled: true 
    }).exec();
    
    if (!branch) {
      throw new NotFoundException('Branch not found or disabled');
    }

    // Generate new QR code
    const qrCode = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create QR code record
    const qrCodeDoc = await this.qrCodeModel.create({
      code: qrCode,
      customerId,
      branchId,
      expiresAt
    });

    // Update customer with new QR code reference
    customer.qrCodeId = qrCodeDoc._id as any;
    await customer.save();

    // Log QR code generation
    await this.auditLogModel.create({
      action: 'GENERATE_QR_CODE',
      entity: 'Customer',
      entityId: customer._id,
      employeeId: requesterId,
      branchId: branchId,
      newValues: {
        qrCode: qrCode,
        expiresAt: expiresAt
      },
      ipAddress,
    });

    return {
      qrCode,
      expiresAt,
      message: 'QR code generated successfully. Customer can use this code to log in.'
    };
  }
}
