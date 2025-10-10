import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';
import { Customer, CustomerDocument } from '../schemas/customer.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Branch, BranchDocument } from '../schemas/branch.schema';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(createOrderDto: CreateOrderDto, requesterId: string, branchId: string, ipAddress: string): Promise<Order> {
    // Verify customer exists
    const customer = await this.customerModel.findById(createOrderDto.customerId).exec();
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Verify product exists and is active
    const product = await this.productModel.findOne({ 
      _id: createOrderDto.productId, 
      active: true 
    }).exec();
    if (!product) {
      throw new NotFoundException('Product not found or inactive');
    }

    // Verify branch exists
    const branch = await this.branchModel.findById(branchId).exec();
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const order = new this.orderModel({
      ...createOrderDto,
      customerName: createOrderDto.customerName || `${customer.firstname} ${customer.lastname}`,
      productName: createOrderDto.productName || product.name,
      branchId,
      employeeId: requesterId,
      status: 'pending',
    });

    const savedOrder = await order.save();

    // Update customer's last visit
    await this.customerModel.findByIdAndUpdate(customer._id, { 
      lastVisit: new Date() 
    }).exec();

    // Log order creation
    await this.auditLogModel.create({
      action: 'CREATE',
      entity: 'Order',
      entityId: savedOrder._id,
      employeeId: requesterId,
      customerId: customer._id,
      branchId,
      newValues: savedOrder.toObject(),
      ipAddress,
    });

    return savedOrder;
  }

  async findAll(branchId?: string, customerId?: string, status?: string): Promise<Order[]> {
    const filter: any = {};
    
    if (branchId) {
      filter.branchId = branchId;
    }
    
    if (customerId) {
      filter.customerId = customerId;
    }
    
    if (status) {
      filter.status = status;
    }

    return this.orderModel.find(filter)
      .populate('customerId', 'firstname lastname email')
      .populate('productId', 'name type price')
      .populate('employeeId', 'firstname lastname')
      .populate('branchId', 'branchName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id)
      .populate('customerId', 'firstname lastname email')
      .populate('productId', 'name type price')
      .populate('employeeId', 'firstname lastname')
      .populate('branchId', 'branchName')
      .exec();
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, requesterId: string, ipAddress: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if order can be updated (not already paid or canceled)
    if (order.status === 'paid' || order.status === 'canceled') {
      throw new BadRequestException('Cannot update paid or canceled order');
    }

    const oldValues = order.toObject();
    Object.assign(order, updateOrderDto);
    const updatedOrder = await order.save();

    // Log update
    await this.auditLogModel.create({
      action: 'UPDATE',
      entity: 'Order',
      entityId: order._id,
      employeeId: requesterId,
      customerId: order.customerId,
      branchId: order.branchId,
      oldValues,
      newValues: updatedOrder.toObject(),
      ipAddress,
    });

    return updatedOrder;
  }

  async remove(id: string, requesterId: string, ipAddress: string): Promise<void> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if order can be deleted (not already paid)
    if (order.status === 'paid') {
      throw new BadRequestException('Cannot delete paid order');
    }

    await this.orderModel.findByIdAndDelete(id).exec();

    // Log deletion
    await this.auditLogModel.create({
      action: 'DELETE',
      entity: 'Order',
      entityId: order._id,
      employeeId: requesterId,
      customerId: order.customerId,
      branchId: order.branchId,
      oldValues: order.toObject(),
      ipAddress,
    });
  }

  async updateStatus(id: string, status: 'pending' | 'paid' | 'canceled', requesterId: string, ipAddress: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const oldValues = order.toObject();
    order.status = status;
    const updatedOrder = await order.save();

    // Log status change
    await this.auditLogModel.create({
      action: 'UPDATE_STATUS',
      entity: 'Order',
      entityId: order._id,
      employeeId: requesterId,
      customerId: order.customerId,
      branchId: order.branchId,
      oldValues,
      newValues: updatedOrder.toObject(),
      ipAddress,
    });

    return updatedOrder;
  }

  async getOrderStats(branchId?: string, startDate?: Date, endDate?: Date) {
    const filter: any = {};
    
    if (branchId) {
      filter.branchId = branchId;
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }

    const orders = await this.orderModel.find(filter).exec();
    
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.price, 0);
    const paidOrders = orders.filter(order => order.status === 'paid');
    const pendingOrders = orders.filter(order => order.status === 'pending');
    const canceledOrders = orders.filter(order => order.status === 'canceled');
    
    const revenueByPaymentMethod = orders.reduce((acc, order) => {
      acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + order.price;
      return acc;
    }, {});

    const revenueByProduct = orders.reduce((acc, order) => {
      acc[order.productName] = (acc[order.productName] || 0) + order.price;
      return acc;
    }, {});

    return {
      totalOrders,
      totalRevenue,
      paidOrders: paidOrders.length,
      pendingOrders: pendingOrders.length,
      canceledOrders: canceledOrders.length,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      revenueByPaymentMethod,
      revenueByProduct,
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      }
    };
  }

  async getRecentOrders(branchId?: string, limit: number = 10): Promise<Order[]> {
    const filter = branchId ? { branchId } : {};
    
    return this.orderModel.find(filter)
      .populate('customerId', 'firstname lastname email')
      .populate('productId', 'name type price')
      .populate('employeeId', 'firstname lastname')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
