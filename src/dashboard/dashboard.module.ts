import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Customer, CustomerSchema } from '../schemas/customer.schema';
import { Order, OrderSchema } from '../schemas/order.schema';
import { Employee, EmployeeSchema } from '../schemas/employee.schema';
import { Branch, BranchSchema } from '../schemas/branch.schema';
import { Product, ProductSchema } from '../schemas/product.schema';
import { Company, CompanySchema } from '../schemas/company.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
