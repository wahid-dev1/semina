import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Branch, BranchDocument } from '../schemas/branch.schema';
import { Service, ServiceDocument } from '../schemas/service.schema';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';
import { Order, OrderDocument } from '../schemas/order.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async create(createProductDto: CreateProductDto, requesterId: string, ipAddress: string): Promise<Product> {
    // Verify branch exists
    const branch = await this.branchModel.findById(createProductDto.branchId).exec();
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Verify company exists
    const company = await this.branchModel.findById(createProductDto.branchId).populate('companyId').exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check if product with same name already exists in the same branch
    const existingProduct = await this.productModel.findOne({
      name: createProductDto.name,
      branchId: createProductDto.branchId
    }).exec();

    if (existingProduct) {
      throw new ConflictException('Product with this name already exists in this branch');
    }

    // For bundle products, validate that the service exists and is available in the branch
    if (createProductDto.type === 'bundle') {
      const service = await this.serviceModel.findOne({ 
        _id: createProductDto.serviceId,
        active: true 
      }).exec();
      
      if (!service) {
        throw new ConflictException('Service not found or inactive');
      }
      
      // Check if service is available in the branch
      const branchServiceIds = branch.serviceIds.map(id => id.toString());
      if (!branchServiceIds.includes(createProductDto.serviceId)) {
        throw new ConflictException(`Service '${service.name}' is not available in this branch`);
      }
    }

    const product = new this.productModel({
      ...createProductDto,
      companyId: company.companyId
    });
    const savedProduct = await product.save();

    // Log creation
    await this.auditLogModel.create({
      action: 'CREATE',
      entity: 'Product',
      entityId: savedProduct._id,
      employeeId: requesterId,
      branchId: createProductDto.branchId,
      newValues: savedProduct.toObject(),
      ipAddress,
    });

    return savedProduct;
  }

  async findAll(branchId?: string, type?: string, active?: boolean): Promise<Product[]> {
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

    return this.productModel.find(filter)
      .populate('branchId', 'branchName')
      .populate('companyId', 'name')
      .sort({ name: 1 })
      .exec();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findById(id)
      .populate('branchId', 'branchName')
      .exec();
    
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, requesterId: string, ipAddress: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // If branchId is being changed, verify new branch exists
    if (updateProductDto.branchId && updateProductDto.branchId !== product.branchId?.toString()) {
      const branch = await this.branchModel.findById(updateProductDto.branchId).exec();
      if (!branch) {
        throw new NotFoundException('Branch not found');
      }
    }

    // Check if name is being changed and if it already exists in the same scope
    if (updateProductDto.name && updateProductDto.name !== product.name) {
      const existingProduct = await this.productModel.findOne({
        name: updateProductDto.name,
        _id: { $ne: id },
        $or: [
          { branchId: updateProductDto.branchId || product.branchId },
          { branchId: { $exists: !(updateProductDto.branchId || product.branchId) } }
        ]
      }).exec();
      
      if (existingProduct) {
        throw new ConflictException('Product with this name already exists in this scope');
      }
    }

    const oldValues = product.toObject();
    Object.assign(product, updateProductDto);
    const updatedProduct = await product.save();

    // Log update
    await this.auditLogModel.create({
      action: 'UPDATE',
      entity: 'Product',
      entityId: product._id,
      employeeId: requesterId,
      branchId: product.branchId,
      oldValues,
      newValues: updatedProduct.toObject(),
      ipAddress,
    });

    return updatedProduct;
  }

  async remove(id: string, requesterId: string, ipAddress: string): Promise<void> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if product is being used in any orders
    // Note: In a real implementation, you'd check for related orders here
    // For now, we'll just delete the product

    await this.productModel.findByIdAndDelete(id).exec();

    // Log deletion
    await this.auditLogModel.create({
      action: 'DELETE',
      entity: 'Product',
      entityId: product._id,
      employeeId: requesterId,
      branchId: product.branchId,
      oldValues: product.toObject(),
      ipAddress,
    });
  }

  async toggleStatus(id: string, requesterId: string, ipAddress: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const oldValues = product.toObject();
    product.active = !product.active;
    const updatedProduct = await product.save();

    // Log status change
    await this.auditLogModel.create({
      action: product.active ? 'ACTIVATE' : 'DEACTIVATE',
      entity: 'Product',
      entityId: product._id,
      employeeId: requesterId,
      branchId: product.branchId,
      oldValues,
      newValues: updatedProduct.toObject(),
      ipAddress,
    });

    return updatedProduct;
  }

  async getProductStats(branchId?: string) {
    const filter = branchId ? { branchId } : {};
    
    const products = await this.productModel.find(filter).exec();
    
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.active).length;
    const inactiveProducts = products.filter(p => !p.active).length;
    
    const productsByType = products.reduce((acc, product) => {
      acc[product.type] = (acc[product.type] || 0) + 1;
      return acc;
    }, {});

    const averagePrice = products.length > 0 
      ? products.reduce((sum, product) => sum + product.price, 0) / products.length 
      : 0;

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      productsByType,
      averagePrice,
      priceRange: {
        min: products.length > 0 ? Math.min(...products.map(p => p.price)) : 0,
        max: products.length > 0 ? Math.max(...products.map(p => p.price)) : 0,
      }
    };
  }

  async useService(productId: string, serviceId: string, quantity: number, customerId: string, orderId: string, branchId: string, employeeId?: string): Promise<void> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.type !== 'bundle') {
      throw new ConflictException('Product is not a bundle');
    }

    // Check if the service ID matches the product's service
    if (product.serviceId.toString() !== serviceId) {
      throw new NotFoundException('Service not found in this product');
    }

    if (product.usedQuantity + quantity > product.quantity) {
      throw new ConflictException('Not enough remaining quantity for this service');
    }

    // Update used quantity
    product.usedQuantity += quantity;
    await product.save();

    // Log service usage
    await this.auditLogModel.create({
      action: 'USE_SERVICE',
      entity: 'Product',
      entityId: product._id,
      employeeId,
      branchId,
      customerId,
      orderId,
      newValues: { serviceId, quantityUsed: quantity },
      ipAddress: 'system',
    });
  }

  async useServiceFromOrder(orderId: string, serviceId: string, quantity: number, customerId: string, branchId: string, employeeId?: string): Promise<void> {
    // Find the order and get the product bundles
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Find the product bundle in the order that contains this service
    const productItem = order.itemType === 'product' && 
      order.includedServiceIds && 
      order.includedServiceIds.some(id => id.toString() === serviceId) ? order : null;

    if (!productItem || !productItem.productId) {
      throw new NotFoundException('Service not found in any product bundle in this order');
    }

    // Use the service from the product
    await this.useService(
      productItem.productId.toString(),
      serviceId,
      quantity,
      customerId,
      orderId,
      branchId,
      employeeId
    );
  }

  async getRemainingServices(productId: string): Promise<any> {
    const product = await this.productModel.findById(productId)
      .populate('serviceId', 'name type')
      .exec();
    
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.type !== 'bundle') {
      return { message: 'Product is not a bundle' };
    }

    return {
      serviceId: product.serviceId,
      serviceName: (product.serviceId as any).name,
      serviceType: (product.serviceId as any).type,
      totalQuantity: product.quantity,
      usedQuantity: product.usedQuantity,
      remainingQuantity: product.quantity - product.usedQuantity
    };
  }
}
