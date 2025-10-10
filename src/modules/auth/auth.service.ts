import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Employee, EmployeeDocument } from '../../schemas/employee.schema';
import { Customer, CustomerDocument } from '../../schemas/customer.schema';
import { QRCode, QRCodeDocument } from '../../schemas/qrcode.schema';
import { Session, SessionDocument } from '../../schemas/session.schema';
import { LoginDto, LoginQRDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(QRCode.name) private qrCodeModel: Model<QRCodeDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    // Try to find employee first
    let user: any = await this.employeeModel.findOne({ email }).populate('branchId');
    let userType = 'employee';

    if (!user) {
      // Try to find customer
      user = await this.customerModel.findOne({ email }).populate('branchId');
      userType = 'customer';
    }

    if (!user || !user.enabled) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return {
      userId: user._id,
      userType,
      role: user.role,
      branchId: user.branchId,
      email: user.email,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async loginWithQR(loginQRDto: LoginQRDto): Promise<AuthResponseDto> {
    const qrCode = await this.qrCodeModel.findOne({
      code: loginQRDto.qrCode,
      isValid: true,
      expiresAt: { $gt: new Date() },
    }).populate('customerId');

    if (!qrCode) {
      throw new UnauthorizedException('Invalid or expired QR code');
    }

    const customer = await this.customerModel.findById(qrCode.customerId).populate('branchId');
    if (!customer || !customer.enabled) {
      throw new UnauthorizedException('Customer not found or disabled');
    }

    // Mark QR code as used
    qrCode.isValid = false;
    qrCode.usedAt = new Date();
    await qrCode.save();

    const user = {
      userId: customer._id,
      userType: 'customer',
      branchId: customer.branchId,
      email: customer.email,
    };

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const session = await this.sessionModel.findOne({
        token: refreshToken,
        isActive: true,
        expiresAt: { $gt: new Date() },
      });

      if (!session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = {
        userId: payload.userId,
        userType: payload.userType,
        role: payload.role,
        branchId: payload.branchId,
        email: payload.email,
      };

      // Deactivate old session
      session.isActive = false;
      await session.save();

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(token: string): Promise<void> {
    await this.sessionModel.updateOne(
      { token },
      { isActive: false }
    );
  }

  private async generateTokens(user: any): Promise<AuthResponseDto> {
    const payload = {
      userId: user.userId,
      userType: user.userType,
      role: user.role,
      branchId: user.branchId,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.sessionModel.create({
      token: refreshToken,
      employeeId: user.userType === 'employee' ? user.userId : undefined,
      customerId: user.userType === 'customer' ? user.userId : undefined,
      userType: user.userType,
      expiresAt,
      isActive: true,
      lastActivity: new Date(),
    });

    return {
      accessToken,
      refreshToken,
      userType: user.userType,
      role: user.role,
      userId: user.userId.toString(),
      branchId: user.branchId?.toString(),
    };
  }
}
