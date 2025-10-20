import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';
import { Customer, CustomerDocument } from '../schemas/customer.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Service, ServiceDocument } from '../schemas/service.schema';
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
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(createOrderDto: CreateOrderDto, requesterId: string, branchId: string, ipAddress: string): Promise<Order> {
    // Verify customer exists
    const customer = await this.customerModel.findById(createOrderDto.customerId).exec();
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Verify branch exists
    const branch = await this.branchModel.findById(branchId).exec();
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Process the single item in the order
    let processedItem: any = {};
    
    if (createOrderDto.itemType === 'service') {
      // For direct service purchases, validate service exists and is available in branch
      const service = await this.serviceModel.findOne({ 
        _id: createOrderDto.serviceId,
        active: true 
      }).exec();
      
      if (!service) {
        throw new NotFoundException(`Service not found or inactive`);
      }
      
      // Check if service is available in this branch
      const isServiceAvailable = branch.serviceIds.some(id => id.toString() === service._id.toString());
      if (!isServiceAvailable) {
        throw new NotFoundException(`Service '${service.name}' is not available in this branch`);
      }
      
      processedItem = {
        itemType: 'service',
        serviceId: service._id,
        itemName: service.name,
        price: service.price,
        quantity: createOrderDto.quantity || 1,
        serviceType: service.type,
        duration: service.duration,
      };
    } else if (createOrderDto.itemType === 'product') {
      // For product purchases, verify product exists and is active
      if (!createOrderDto.productId) {
        throw new BadRequestException('Product ID is required for product type items');
      }
      
      const product = await this.productModel.findOne({ 
        _id: createOrderDto.productId, 
        active: true,
        branchId: branchId
      }).populate('serviceId').exec();
      
      if (!product) {
        throw new NotFoundException(`Product not found or inactive in this branch`);
      }
      
      // For bundle products, get service ID
      const includedServiceIds = product.type === 'bundle' 
        ? [product.serviceId]
        : [];
      
      processedItem = {
        itemType: 'product',
        productId: product._id,
        itemName: product.name,
        price: product.price,
        quantity: createOrderDto.quantity || 1,
        includedServiceIds,
      };
    }

    // Calculate total price
    const totalPrice = processedItem.price * processedItem.quantity;

    const order = new this.orderModel({
      ...createOrderDto,
      ...processedItem,
      customerName: createOrderDto.customerName || `${customer.firstname} ${customer.lastname}`,
      branchId,
      totalPrice,
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
      .populate('productId', 'name type price serviceBundles')
      .populate('serviceId', 'name type price duration')
      .populate('employeeId', 'firstname lastname')
      .populate('branchId', 'branchName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id)
      .populate('customerId', 'firstname lastname email')
      .populate('productId', 'name type price serviceBundles')
      .populate('serviceId', 'name type price duration')
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
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const paidOrders = orders.filter(order => order.status === 'paid');
    const pendingOrders = orders.filter(order => order.status === 'pending');
    const canceledOrders = orders.filter(order => order.status === 'canceled');
    
    const revenueByPaymentMethod = orders.reduce((acc, order) => {
      acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + order.totalPrice;
      return acc;
    }, {});

    const revenueByProduct = orders.reduce((acc, order) => {
      acc[order.itemName] = (acc[order.itemName] || 0) + (order.price * order.quantity);
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
      .populate('productId', 'name type price serviceBundles')
      .populate('serviceId', 'name type price duration')
      .populate('employeeId', 'firstname lastname')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getAvailableServices(branchId: string): Promise<any[]> {
    const branch = await this.branchModel.findById(branchId).exec();
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const services = await this.serviceModel.find({
      _id: { $in: branch.serviceIds },
      active: true
    }).exec();

    return services.map(service => ({
      id: service._id,
      name: service.name,
      description: service.description,
      type: service.type,
      price: service.price,
      duration: service.duration
    }));
  }

  async getAvailableProducts(branchId: string): Promise<any[]> {
    const products = await this.productModel.find({
      branchId,
      active: true
    })
    .populate('branchId', 'branchName')
    .populate('serviceId', 'name type price duration')
    .exec();

    return products.map(product => ({
      id: product._id,
      name: product.name,
      description: product.description,
      type: product.type,
      price: product.price,
      service: product.type === 'bundle' ? {
        serviceId: product.serviceId,
        serviceName: (product.serviceId as any).name,
        serviceType: (product.serviceId as any).type,
        quantity: product.quantity,
        usedQuantity: product.usedQuantity,
        remainingQuantity: product.quantity - product.usedQuantity
      } : null
    }));
  }
}
