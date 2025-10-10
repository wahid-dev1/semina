import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';
import { Employee, EmployeeDocument } from '../schemas/employee.schema';
import { Customer, CustomerDocument } from '../schemas/customer.schema';
import { Branch, BranchDocument } from '../schemas/branch.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
  ) {}

  async findAll(filters: {
    action?: string;
    entity?: string;
    employeeId?: string;
    customerId?: string;
    branchId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const query: any = {};

    if (filters.action) {
      query.action = { $regex: filters.action, $options: 'i' };
    }

    if (filters.entity) {
      query.entity = { $regex: filters.entity, $options: 'i' };
    }

    if (filters.employeeId) {
      query.employeeId = filters.employeeId;
    }

    if (filters.customerId) {
      query.customerId = filters.customerId;
    }

    if (filters.branchId) {
      query.branchId = filters.branchId;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.createdAt.$lte = filters.endDate;
      }
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.auditLogModel.find(query)
        .populate('employeeId', 'firstname lastname email')
        .populate('customerId', 'firstname lastname email')
        .populate('branchId', 'branchName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(query).exec()
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async findByEntity(entity: string, entityId: string) {
    return this.auditLogModel.find({ entity, entityId })
      .populate('employeeId', 'firstname lastname email')
      .populate('customerId', 'firstname lastname email')
      .populate('branchId', 'branchName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByEmployee(employeeId: string, startDate?: Date, endDate?: Date) {
    const query: any = { employeeId };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = startDate;
      }
      if (endDate) {
        query.createdAt.$lte = endDate;
      }
    }

    return this.auditLogModel.find(query)
      .populate('customerId', 'firstname lastname email')
      .populate('branchId', 'branchName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByBranch(branchId: string, startDate?: Date, endDate?: Date) {
    const query: any = { branchId };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = startDate;
      }
      if (endDate) {
        query.createdAt.$lte = endDate;
      }
    }

    return this.auditLogModel.find(query)
      .populate('employeeId', 'firstname lastname email')
      .populate('customerId', 'firstname lastname email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAuditStats(branchId?: string, startDate?: Date, endDate?: Date) {
    const query: any = {};

    if (branchId) {
      query.branchId = branchId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = startDate;
      }
      if (endDate) {
        query.createdAt.$lte = endDate;
      }
    }

    const [
      totalActions,
      actionsByType,
      actionsByEntity,
      actionsByEmployee,
      recentActions
    ] = await Promise.all([
      this.auditLogModel.countDocuments(query).exec(),
      this.auditLogModel.aggregate([
        { $match: query },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).exec(),
      this.auditLogModel.aggregate([
        { $match: query },
        { $group: { _id: '$entity', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).exec(),
      this.auditLogModel.aggregate([
        { $match: { ...query, employeeId: { $exists: true } } },
        {
          $group: {
            _id: '$employeeId',
            count: { $sum: 1 },
            actions: { $addToSet: '$action' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'employees',
            localField: '_id',
            foreignField: '_id',
            as: 'employee'
          }
        },
        { $unwind: '$employee' }
      ]).exec(),
      this.auditLogModel.find(query)
        .populate('employeeId', 'firstname lastname email')
        .populate('customerId', 'firstname lastname email')
        .populate('branchId', 'branchName')
        .sort({ createdAt: -1 })
        .limit(10)
        .exec()
    ]);

    return {
      totalActions,
      actionsByType,
      actionsByEntity,
      topEmployees: actionsByEmployee.map(emp => ({
        id: emp._id,
        name: `${emp.employee.firstname} ${emp.employee.lastname}`,
        email: emp.employee.email,
        actionCount: emp.count,
        actions: emp.actions
      })),
      recentActions
    };
  }

  async getActivityTimeline(branchId?: string, days: number = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const query: any = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (branchId) {
      query.branchId = branchId;
    }

    const timeline = await this.auditLogModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
            hour: { $hour: '$createdAt' }
          },
          count: { $sum: 1 },
          actions: { $addToSet: '$action' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
    ]).exec();

    return timeline.map(item => ({
      date: new Date(item._id.year, item._id.month - 1, item._id.day, item._id.hour).toISOString(),
      count: item.count,
      actions: item.actions
    }));
  }

  async exportAuditLogs(filters: {
    action?: string;
    entity?: string;
    employeeId?: string;
    customerId?: string;
    branchId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const query: any = {};

    if (filters.action) {
      query.action = { $regex: filters.action, $options: 'i' };
    }

    if (filters.entity) {
      query.entity = { $regex: filters.entity, $options: 'i' };
    }

    if (filters.employeeId) {
      query.employeeId = filters.employeeId;
    }

    if (filters.customerId) {
      query.customerId = filters.customerId;
    }

    if (filters.branchId) {
      query.branchId = filters.branchId;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.createdAt.$lte = filters.endDate;
      }
    }

    return this.auditLogModel.find(query)
      .populate('employeeId', 'firstname lastname email')
      .populate('customerId', 'firstname lastname email')
      .populate('branchId', 'branchName')
      .sort({ createdAt: -1 })
      .exec();
  }
}
