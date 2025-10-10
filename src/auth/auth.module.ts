import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { QRCodeStrategy } from './strategies/qr-code.strategy';
import { Employee, EmployeeSchema } from '../schemas/employee.schema';
import { Customer, CustomerSchema } from '../schemas/customer.schema';
import { QRCode, QRCodeSchema } from '../schemas/qr-code.schema';
import { Session, SessionSchema } from '../schemas/session.schema';
import { AuditLog, AuditLogSchema } from '../schemas/audit-log.schema';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h',
        },
      } as any),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: QRCode.name, schema: QRCodeSchema },
      { name: Session.name, schema: SessionSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy, QRCodeStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
