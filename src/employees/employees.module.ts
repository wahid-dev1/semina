import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Employee, EmployeeSchema } from '../schemas/employee.schema';
import { Branch, BranchSchema } from '../schemas/branch.schema';
import { AuditLog, AuditLogSchema } from '../schemas/audit-log.schema';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { SuperAdminInitializer } from './super-admin.initializer';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService, SuperAdminInitializer],
  exports: [EmployeesService],
})
export class EmployeesModule {}
