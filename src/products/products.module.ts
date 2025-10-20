import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product, ProductSchema } from '../schemas/product.schema';
import { Branch, BranchSchema } from '../schemas/branch.schema';
import { Service, ServiceSchema } from '../schemas/service.schema';
import { AuditLog, AuditLogSchema } from '../schemas/audit-log.schema';
import { ServiceUsage, ServiceUsageSchema } from '../schemas/service-usage.schema';
import { Order, OrderSchema } from '../schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: ServiceUsage.name, schema: ServiceUsageSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
