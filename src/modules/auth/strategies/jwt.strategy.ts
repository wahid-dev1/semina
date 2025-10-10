import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Employee, EmployeeDocument } from '../../../schemas/employee.schema';
import { Customer, CustomerDocument } from '../../../schemas/customer.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const { userId, userType } = payload;

    if (userType === 'employee') {
      const employee = await this.employeeModel.findById(userId).populate('branchId');
      if (!employee || !employee.enabled) {
        throw new UnauthorizedException('Employee not found or disabled');
      }
      return {
        userId: employee._id,
        userType: 'employee',
        role: employee.role,
        branchId: employee.branchId,
        email: employee.email,
        username: employee.username,
      };
    } else if (userType === 'customer') {
      const customer = await this.customerModel.findById(userId).populate('branchId');
      if (!customer || !customer.enabled) {
        throw new UnauthorizedException('Customer not found or disabled');
      }
      return {
        userId: customer._id,
        userType: 'customer',
        branchId: customer.branchId,
        email: customer.email,
      };
    }

    throw new UnauthorizedException('Invalid user type');
  }
}
