import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from '../schemas/customer.schema';
import { Order, OrderDocument } from '../schemas/order.schema';
import { Employee, EmployeeDocument } from '../schemas/employee.schema';
import { Branch, BranchDocument } from '../schemas/branch.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { SAMINA_COMPANY_ID } from '@/common/constants/samina.constants';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async getSummary(branchId?: string, _companyId?: string) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Build filter based on user role and provided parameters
    const filter: any = {};
    if (branchId) {
      filter.branchId = branchId;
    } else {
      // Default to all branches for Samina company
      const branches = await this.branchModel.find({ companyId: SAMINA_COMPANY_ID }).select('_id').exec();
      filter.branchId = { $in: branches.map(b => b._id) };
    }

    // Get customer counts
    const totalCustomers = await this.customerModel.countDocuments(filter).exec();
    const newCustomersToday = await this.customerModel.countDocuments({
      ...filter,
      createdAt: { $gte: startOfDay }
    }).exec();

    // Get order statistics
    const totalOrders = await this.orderModel.countDocuments(filter).exec();
    const ordersToday = await this.orderModel.countDocuments({
      ...filter,
      createdAt: { $gte: startOfDay }
    }).exec();

    // Get revenue statistics
    const totalRevenue = await this.orderModel.aggregate([
      { $match: { ...filter, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]).exec();

    const revenueToday = await this.orderModel.aggregate([
      { $match: { ...filter, status: 'paid', createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]).exec();

    const revenueThisWeek = await this.orderModel.aggregate([
      { $match: { ...filter, status: 'paid', createdAt: { $gte: startOfWeek } } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]).exec();

    const revenueThisMonth = await this.orderModel.aggregate([
      { $match: { ...filter, status: 'paid', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]).exec();

    // Get product statistics
    const totalProducts = await this.productModel.countDocuments({
      $or: [
        { branchId: filter.branchId },
        { branchId: { $exists: false } }
      ]
    }).exec();

    const activeProducts = await this.productModel.countDocuments({
      $or: [
        { branchId: filter.branchId },
        { branchId: { $exists: false } }
      ],
      active: true
    }).exec();

    return {
      customers: {
        total: totalCustomers,
        newToday: newCustomersToday,
      },
      orders: {
        total: totalOrders,
        today: ordersToday,
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        today: revenueToday[0]?.total || 0,
        thisWeek: revenueThisWeek[0]?.total || 0,
        thisMonth: revenueThisMonth[0]?.total || 0,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
      },
      period: {
        date: now.toISOString(),
        startOfDay: startOfDay.toISOString(),
        startOfWeek: startOfWeek.toISOString(),
        startOfMonth: startOfMonth.toISOString(),
      }
    };
  }

  async getBranchStats(branchId: string) {
    const branch = await this.branchModel.findById(branchId).exec();
    if (!branch) {
      throw new Error('Branch not found');
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());

    // Get workload per weekday
    const workloadData = await this.orderModel.aggregate([
      { $match: { branchId, status: 'paid' } },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          count: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      },
      { $sort: { _id: 1 } }
    ]).exec();

    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const workload = weekdays.map((day, index) => {
      const data = workloadData.find(d => d._id === index + 1);
      return {
        day,
        orders: data?.count || 0,
        revenue: data?.revenue || 0
      };
    });

    // Get most active customers
    const activeCustomers = await this.orderModel.aggregate([
      { $match: { branchId, status: 'paid' } },
      {
        $group: {
          _id: '$customerId',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$price' },
          lastOrder: { $max: '$createdAt' }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' }
    ]).exec();

    // Get recent customer registrations
    const recentCustomers = await this.customerModel.find({ branchId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('firstname lastname email createdAt')
      .exec();

    // Get last employee logins
    const recentLogins = await this.employeeModel.find({ branchId })
      .sort({ lastLogin: -1 })
      .limit(10)
      .select('firstname lastname lastLogin')
      .exec();

    return {
      branch: {
        id: branch._id,
        name: branch.branchName,
        address: branch.address,
        phone: branch.phone,
        email: branch.email,
      },
      workload,
      activeCustomers: activeCustomers.map(customer => ({
        id: customer._id,
        name: `${customer.customer.firstname} ${customer.customer.lastname}`,
        email: customer.customer.email,
        orderCount: customer.orderCount,
        totalSpent: customer.totalSpent,
        lastOrder: customer.lastOrder
      })),
      recentCustomers: recentCustomers.map(customer => ({
        id: (customer as any)._id.toString(),
        name: `${customer.firstname} ${customer.lastname}`,
        email: customer.email,
        registeredAt: (customer as any).createdAt
      })),
      recentLogins: recentLogins.map(employee => ({
        id: employee._id,
        name: `${employee.firstname} ${employee.lastname}`,
        lastLogin: employee.lastLogin
      }))
    };
  }

  async getRecentLogins(branchId?: string, limit: number = 10) {
    const filter = branchId ? { branchId } : {};
    
    return this.employeeModel.find(filter)
      .sort({ lastLogin: -1 })
      .limit(limit)
      .select('firstname lastname lastLogin branchId')
      .populate('branchId', 'branchName')
      .exec();
  }

  async getRevenueChart(branchId?: string, days: number = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const filter: any = {
      status: 'paid',
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (branchId) {
      filter.branchId = branchId;
    }

    const revenueData = await this.orderModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$price' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]).exec();

    return revenueData.map(data => ({
      date: new Date(data._id.year, data._id.month - 1, data._id.day).toISOString().split('T')[0],
      revenue: data.revenue,
      orders: data.orders
    }));
  }

  async getProductPerformance(branchId?: string, limit: number = 10) {
    const filter: any = { status: 'paid' };
    if (branchId) {
      filter.branchId = branchId;
    }

    const productData = await this.orderModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$productId',
          productName: { $first: '$productName' },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$price' },
          averagePrice: { $avg: '$price' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit }
    ]).exec();

    return productData;
  }

  async getCustomerGrowth(branchId?: string, days: number = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const filter: any = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (branchId) {
      filter.branchId = branchId;
    }

    const growthData = await this.customerModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          newCustomers: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]).exec();

    return growthData.map(data => ({
      date: new Date(data._id.year, data._id.month - 1, data._id.day).toISOString().split('T')[0],
      newCustomers: data.newCustomers
    }));
  }
}
