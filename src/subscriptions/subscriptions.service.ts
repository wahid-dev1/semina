import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription, SubscriptionDocument } from '../schemas/subscription.schema';
import { Company, CompanyDocument } from '../schemas/company.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(createSubscriptionDto: CreateSubscriptionDto, requesterId: string, ipAddress: string): Promise<Subscription> {
    // Verify company exists
    const company = await this.companyModel.findById(createSubscriptionDto.franchiseId).exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Verify all products exist and are active
    const products = await this.productModel.find({
      _id: { $in: createSubscriptionDto.productIds },
      active: true
    }).exec();

    if (products.length !== createSubscriptionDto.productIds.length) {
      throw new BadRequestException('One or more products not found or inactive');
    }

    // Check for date validity
    const startDate = new Date(createSubscriptionDto.startDate);
    const endDate = new Date(createSubscriptionDto.endDate);
    
    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Check for overlapping subscriptions
    const overlappingSubscription = await this.subscriptionModel.findOne({
      franchiseId: createSubscriptionDto.franchiseId,
      active: true,
      $or: [
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate }
        }
      ]
    }).exec();

    if (overlappingSubscription) {
      throw new BadRequestException('Active subscription already exists for this period');
    }

    const subscription = new this.subscriptionModel(createSubscriptionDto);
    const savedSubscription = await subscription.save();

    // Log creation
    await this.auditLogModel.create({
      action: 'CREATE',
      entity: 'Subscription',
      entityId: savedSubscription._id,
      employeeId: requesterId,
      newValues: savedSubscription.toObject(),
      ipAddress,
    });

    return savedSubscription;
  }

  async findAll(franchiseId?: string, active?: boolean): Promise<Subscription[]> {
    const filter: any = {};
    
    if (franchiseId) {
      filter.franchiseId = franchiseId;
    }
    
    if (active !== undefined) {
      filter.active = active;
    }

    return this.subscriptionModel.find(filter)
      .populate('franchiseId', 'name')
      .populate('productIds', 'name type price')
      .sort({ startDate: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionModel.findById(id)
      .populate('franchiseId', 'name')
      .populate('productIds', 'name type price')
      .exec();
    
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    
    return subscription;
  }

  async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto, requesterId: string, ipAddress: string): Promise<Subscription> {
    const subscription = await this.subscriptionModel.findById(id).exec();
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // If franchiseId is being changed, verify new company exists
    if (updateSubscriptionDto.franchiseId && updateSubscriptionDto.franchiseId !== subscription.franchiseId.toString()) {
      const company = await this.companyModel.findById(updateSubscriptionDto.franchiseId).exec();
      if (!company) {
        throw new NotFoundException('Company not found');
      }
    }

    // If productIds are being changed, verify all products exist and are active
    if (updateSubscriptionDto.productIds) {
      const products = await this.productModel.find({
        _id: { $in: updateSubscriptionDto.productIds },
        active: true
      }).exec();

      if (products.length !== updateSubscriptionDto.productIds.length) {
        throw new BadRequestException('One or more products not found or inactive');
      }
    }

    // If dates are being changed, check for validity
    if (updateSubscriptionDto.startDate || updateSubscriptionDto.endDate) {
      const startDate = new Date(updateSubscriptionDto.startDate || subscription.startDate);
      const endDate = new Date(updateSubscriptionDto.endDate || subscription.endDate);
      
      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    const oldValues = subscription.toObject();
    Object.assign(subscription, updateSubscriptionDto);
    const updatedSubscription = await subscription.save();

    // Log update
    await this.auditLogModel.create({
      action: 'UPDATE',
      entity: 'Subscription',
      entityId: subscription._id,
      employeeId: requesterId,
      oldValues,
      newValues: updatedSubscription.toObject(),
      ipAddress,
    });

    return updatedSubscription;
  }

  async remove(id: string, requesterId: string, ipAddress: string): Promise<void> {
    const subscription = await this.subscriptionModel.findById(id).exec();
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    await this.subscriptionModel.findByIdAndDelete(id).exec();

    // Log deletion
    await this.auditLogModel.create({
      action: 'DELETE',
      entity: 'Subscription',
      entityId: subscription._id,
      employeeId: requesterId,
      oldValues: subscription.toObject(),
      ipAddress,
    });
  }

  async toggleStatus(id: string, requesterId: string, ipAddress: string): Promise<Subscription> {
    const subscription = await this.subscriptionModel.findById(id).exec();
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const oldValues = subscription.toObject();
    subscription.active = !subscription.active;
    const updatedSubscription = await subscription.save();

    // Log status change
    await this.auditLogModel.create({
      action: subscription.active ? 'ACTIVATE' : 'DEACTIVATE',
      entity: 'Subscription',
      entityId: subscription._id,
      employeeId: requesterId,
      oldValues,
      newValues: updatedSubscription.toObject(),
      ipAddress,
    });

    return updatedSubscription;
  }

  async getActiveSubscriptions(franchiseId: string): Promise<Subscription[]> {
    const now = new Date();
    
    return this.subscriptionModel.find({
      franchiseId,
      active: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    })
    .populate('productIds', 'name type price')
    .exec();
  }

  async getSubscriptionStats(franchiseId?: string) {
    const filter = franchiseId ? { franchiseId } : {};
    
    const subscriptions = await this.subscriptionModel.find(filter).exec();
    
    const totalSubscriptions = subscriptions.length;
    const activeSubscriptions = subscriptions.filter(s => s.active).length;
    const inactiveSubscriptions = subscriptions.filter(s => !s.active).length;
    
    const now = new Date();
    const currentSubscriptions = subscriptions.filter(s => 
      s.active && s.startDate <= now && s.endDate >= now
    ).length;

    const expiringSoon = subscriptions.filter(s => {
      const daysUntilExpiry = Math.ceil((s.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return s.active && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length;

    return {
      totalSubscriptions,
      activeSubscriptions,
      inactiveSubscriptions,
      currentSubscriptions,
      expiringSoon,
      averageDuration: subscriptions.length > 0 
        ? subscriptions.reduce((sum, s) => {
            const duration = s.endDate.getTime() - s.startDate.getTime();
            return sum + (duration / (1000 * 60 * 60 * 24)); // Convert to days
          }, 0) / subscriptions.length
        : 0
    };
  }
}
