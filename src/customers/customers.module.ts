import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { Customer, CustomerSchema } from '../schemas/customer.schema';
import { Branch, BranchSchema } from '../schemas/branch.schema';
import { MedicalHistory, MedicalHistorySchema } from '../schemas/medical-history.schema';
import { Order, OrderSchema } from '../schemas/order.schema';
import { QRCode, QRCodeSchema } from '../schemas/qr-code.schema';
import { AuditLog, AuditLogSchema } from '../schemas/audit-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: MedicalHistory.name, schema: MedicalHistorySchema },
      { name: Order.name, schema: OrderSchema },
      { name: QRCode.name, schema: QRCodeSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
