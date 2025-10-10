import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from '../../schemas/customer.schema';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { Employee, EmployeeDocument } from '../../schemas/employee.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
  ) {}

  async getSummary(branchId?: string): Promise<any> {
    const filter = branchId ? { branchId } : {};

    const [
      totalCustomers,
      totalOrders,
      totalRevenue,
      todayOrders,
      recentCustomers,
      recentLogins
    ] = await Promise.all([
      this.customerModel.countDocuments(filter),
      this.orderModel.countDocuments(filter),
      this.orderModel.aggregate([
        { $match: { ...filter, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ]),
      this.orderModel.countDocuments({
        ...filter,
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      this.customerModel.find(filter)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('branchId')
        .exec(),
      this.employeeModel.find({ lastLogin: { $exists: true } })
        .sort({ lastLogin: -1 })
        .limit(5)
        .populate('branchId')
        .exec()
    ]);

    return {
      totalCustomers,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      todayOrders,
      recentCustomers,
      recentLogins
    };
  }

  async getBranchStats(): Promise<any> {
    const branches = await this.branchModel.find({ enabled: true }).exec();
    
    const branchStats = await Promise.all(
      branches.map(async (branch) => {
        const [customerCount, orderCount, revenue] = await Promise.all([
          this.customerModel.countDocuments({ branchId: branch._id }),
          this.orderModel.countDocuments({ branchId: branch._id }),
          this.orderModel.aggregate([
            { $match: { branchId: branch._id, status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$price' } } }
          ])
        ]);

        return {
          branchId: branch._id,
          branchName: branch.branchName,
          customerCount,
          orderCount,
          revenue: revenue[0]?.total || 0
        };
      })
    );

    return branchStats;
  }

  async getWorkloadPerWeekday(branchId?: string): Promise<any> {
    const filter = branchId ? { branchId } : {};
    
    const workload = await this.orderModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          day: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 1] }, then: 'Sunday' },
                { case: { $eq: ['$_id', 2] }, then: 'Monday' },
                { case: { $eq: ['$_id', 3] }, then: 'Tuesday' },
                { case: { $eq: ['$_id', 4] }, then: 'Wednesday' },
                { case: { $eq: ['$_id', 5] }, then: 'Thursday' },
                { case: { $eq: ['$_id', 6] }, then: 'Friday' },
                { case: { $eq: ['$_id', 7] }, then: 'Saturday' }
              ],
              default: 'Unknown'
            }
          },
          count: 1
        }
      }
    ]);

    return workload;
  }

  async getMostActiveCustomers(branchId?: string, limit: number = 10): Promise<any> {
    const filter = branchId ? { branchId } : {};
    
    const activeCustomers = await this.orderModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$customerId',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$price' },
          customerName: { $first: '$customerName' }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: limit }
    ]);

    return activeCustomers;
  }
}
