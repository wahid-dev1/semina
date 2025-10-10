import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicalFormService } from './medical-form.service';
import { MedicalFormController } from './medical-form.controller';
import { Customer, CustomerSchema } from '../../schemas/customer.schema';
import { MedicalHistory, MedicalHistorySchema } from '../../schemas/medical-history.schema';
import { QRCode, QRCodeSchema } from '../../schemas/qrcode.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: MedicalHistory.name, schema: MedicalHistorySchema },
      { name: QRCode.name, schema: QRCodeSchema },
    ]),
  ],
  controllers: [MedicalFormController],
  providers: [MedicalFormService],
  exports: [MedicalFormService],
})
export class MedicalFormModule {}
