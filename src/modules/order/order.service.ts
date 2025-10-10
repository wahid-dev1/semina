import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const order = new this.orderModel(createOrderDto);
    return await order.save();
  }

  async findAll(branchId?: string): Promise<Order[]> {
    const filter = branchId ? { branchId } : {};
    return await this.orderModel.find(filter)
      .populate('customerId')
      .populate('productId')
      .populate('branchId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id)
      .populate('customerId')
      .populate('productId')
      .populate('branchId')
      .exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async findByCustomer(customerId: string): Promise<Order[]> {
    return await this.orderModel.find({ customerId })
      .populate('productId')
      .populate('branchId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getStats(branchId?: string): Promise<any> {
    const filter = branchId ? { branchId } : {};
    
    const stats = await this.orderModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$price' },
          averageOrderValue: { $avg: '$price' },
          paidOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          canceledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'canceled'] }, 1, 0] }
          }
        }
      }
    ]);

    return stats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      paidOrders: 0,
      pendingOrders: 0,
      canceledOrders: 0
    };
  }
}
