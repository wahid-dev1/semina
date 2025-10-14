import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Company, CompanySchema } from '../schemas/company.schema';
import { AuditLog, AuditLogSchema } from '../schemas/audit-log.schema';
import { Employee, EmployeeSchema } from '../schemas/employee.schema';
import { CompanyInitializer } from './company.initializer';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: Employee.name, schema: EmployeeSchema },
    ]),
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService, CompanyInitializer],
  exports: [CompaniesService],
})
export class CompaniesModule {}
