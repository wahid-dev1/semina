import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Branch, BranchDocument } from '../schemas/branch.schema';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(createProductDto: CreateProductDto, requesterId: string, ipAddress: string): Promise<Product> {
    // If branchId is provided, verify branch exists
    if (createProductDto.branchId) {
      const branch = await this.branchModel.findById(createProductDto.branchId).exec();
      if (!branch) {
        throw new NotFoundException('Branch not found');
      }
    }

    // Check if product with same name already exists in the same scope
    const existingProduct = await this.productModel.findOne({
      name: createProductDto.name,
      $or: [
        { branchId: createProductDto.branchId },
        { branchId: { $exists: !createProductDto.branchId } }
      ]
    }).exec();

    if (existingProduct) {
      throw new ConflictException('Product with this name already exists in this scope');
    }

    const product = new this.productModel(createProductDto);
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
      filter.branchId = branchId;
    } else {
      // If no branchId specified, get global products (no branchId) and products for all branches
      filter.$or = [
        { branchId: { $exists: false } },
        { branchId: null }
      ];
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (active !== undefined) {
      filter.active = active;
    }

    return this.productModel.find(filter)
      .populate('branchId', 'branchName')
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
}
