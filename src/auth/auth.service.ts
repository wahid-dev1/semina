import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { Employee, EmployeeDocument } from '../schemas/employee.schema';
import { Customer, CustomerDocument } from '../schemas/customer.schema';
import { QRCode, QRCodeDocument } from '../schemas/qr-code.schema';
import { Session, SessionDocument } from '../schemas/session.schema';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';
import { RedisService } from '../common/database/redis.service';
import { LoginDto, QRLoginDto } from './dto/login.dto';
import { IUser } from '../common/interfaces';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(QRCode.name) private qrCodeModel: Model<QRCodeDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async validateEmployee(email: string, password: string): Promise<any> {
    const employee = await this.employeeModel.findOne({ email, enabled: true }).exec();
    if (employee && await bcrypt.compare(password, employee.password)) {
      const { password: _, ...result } = employee.toObject();
      return result;
    }
    return null;
  }

  async validateCustomer(email: string, password: string): Promise<any> {
    // For customers, we'll use QR code authentication instead
    return null;
  }

  async validateQRCode(qrCode: string): Promise<any> {
    const qr = await this.qrCodeModel.findOne({ 
      code: qrCode, 
      isValid: true,
      expiresAt: { $gt: new Date() }
    }).populate('customerId').exec();

    if (!qr) {
      throw new UnauthorizedException('Invalid or expired QR code');
    }

    return qr;
  }

  async login(loginDto: LoginDto, ipAddress: string, userAgent: string) {
    const employee = await this.validateEmployee(loginDto.email, loginDto.password);
    if (!employee) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.employeeModel.findByIdAndUpdate(employee._id, { lastLogin: new Date() });

    const sessionId = randomUUID();
    const payload = {
      sub: employee._id,
      email: employee.email,
      role: employee.role,
      branchId: employee.branchId,
      type: 'employee',
      sessionId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Store session in Redis
    await this.redisService.set(`session:${sessionId}`, JSON.stringify({
      userId: employee._id,
      type: 'employee',
      branchId: employee.branchId,
      role: employee.role
    }), 7 * 24 * 60 * 60); // 7 days

    // Store session in MongoDB
    await this.sessionModel.create({
      token: sessionId,
      employeeId: employee._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lastActivity: new Date()
    });

    // Log login
    await this.auditLogModel.create({
      action: 'LOGIN',
      entity: 'Employee',
      entityId: employee._id,
      employeeId: employee._id,
      branchId: employee.branchId,
      ipAddress,
      userAgent
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: employee._id,
        email: employee.email,
        role: employee.role,
        branchId: employee.branchId,
        firstname: employee.firstname,
        lastname: employee.lastname
      }
    };
  }

  async loginWithQR(qrLoginDto: QRLoginDto, ipAddress: string, userAgent: string) {
    const qr = await this.validateQRCode(qrLoginDto.qrCode);
    const customer = qr.customerId;

    if (!customer) {
      throw new UnauthorizedException('QR code not associated with customer');
    }

    // Mark QR code as used
    await this.qrCodeModel.findByIdAndUpdate(qr._id, {
      isValid: false,
      usedAt: new Date()
    });

    const sessionId = randomUUID();
    const payload = {
      sub: customer._id,
      email: customer.email,
      branchId: customer.branchId,
      type: 'customer',
      sessionId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '24h' });

    // Store session in Redis
    await this.redisService.set(`session:${sessionId}`, JSON.stringify({
      userId: customer._id,
      type: 'customer',
      branchId: customer.branchId
    }), 24 * 60 * 60); // 24 hours

    // Store session in MongoDB
    await this.sessionModel.create({
      token: sessionId,
      customerId: customer._id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      lastActivity: new Date()
    });

    // Log login
    await this.auditLogModel.create({
      action: 'LOGIN_QR',
      entity: 'Customer',
      entityId: customer._id,
      customerId: customer._id,
      branchId: customer.branchId,
      ipAddress,
      userAgent
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: customer._id,
        email: customer.email,
        branchId: customer.branchId,
        firstname: customer.firstname,
        lastname: customer.lastname
      }
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const newPayload = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        branchId: payload.branchId,
        type: payload.type
      };

      const newAccessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(sessionId: string) {
    // Remove from Redis
    await this.redisService.del(`session:${sessionId}`);
    
    // Mark session as inactive in MongoDB
    await this.sessionModel.findOneAndUpdate(
      { token: sessionId },
      { isActive: false }
    );
  }

  async generateQRCode(customerId: string, branchId: string): Promise<string> {
    const qrCode = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.qrCodeModel.create({
      code: qrCode,
      customerId,
      branchId,
      expiresAt
    });

    return qrCode;
  }
}
