import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Employee, EmployeeDocument } from '../schemas/employee.schema';
import { Branch, BranchDocument } from '../schemas/branch.schema';

@Injectable()
export class SuperAdminInitializer implements OnModuleInit {
  private readonly logger = new Logger(SuperAdminInitializer.name);

  constructor(
    @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(Branch.name) private readonly branchModel: Model<BranchDocument>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const email = this.configService.get<string>('SUPER_ADMIN_EMAIL');
      const password = this.configService.get<string>('SUPER_ADMIN_PASSWORD');

      if (!email || !password) {
        this.logger.log('Super admin bootstrap skipped: missing SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD.');
        return;
      }

      const existingSuperAdmin = await this.employeeModel.findOne({ role: 'super-admin' }).exec();
      if (existingSuperAdmin) {
        this.logger.debug('Super admin already exists; bootstrap skipped.');
        return;
      }

      const username = this.configService.get<string>('SUPER_ADMIN_USERNAME') ?? 'superadmin';
      const firstname = this.configService.get<string>('SUPER_ADMIN_FIRSTNAME') ?? 'Super';
      const lastname = this.configService.get<string>('SUPER_ADMIN_LASTNAME') ?? 'Admin';
      const personalPinEnv = this.configService.get<string>('SUPER_ADMIN_PIN') ?? '0000';
      const language = this.configService.get<string>('SUPER_ADMIN_LANGUAGE') ?? 'en';
      const branchIdEnv = this.configService.get<string>('SUPER_ADMIN_BRANCH_ID');

      const existingByEmail = await this.employeeModel.findOne({ email }).exec();
      if (existingByEmail) {
        this.logger.warn(`Super admin bootstrap skipped: employee with email ${email} already exists.`);
        return;
      }

      const existingByUsername = await this.employeeModel.findOne({ username }).exec();
      if (existingByUsername) {
        this.logger.warn(`Super admin bootstrap skipped: username ${username} is already in use.`);
        return;
      }

      const pinIsValid = /^\d{4}$/.test(personalPinEnv);
      const personalPin = pinIsValid ? personalPinEnv : '0000';
      if (!pinIsValid) {
        this.logger.warn('SUPER_ADMIN_PIN must be a 4-digit string. Falling back to 0000.');
      }

      let branchId: Types.ObjectId | undefined;
      if (branchIdEnv) {
        if (!Types.ObjectId.isValid(branchIdEnv)) {
          this.logger.warn(`SUPER_ADMIN_BRANCH_ID ${branchIdEnv} is not a valid ObjectId. Creating super admin without branch.`);
        } else {
          const branch = await this.branchModel.findById(branchIdEnv).exec();
          if (!branch) {
            this.logger.warn(`SUPER_ADMIN_BRANCH_ID ${branchIdEnv} not found. Creating super admin without branch.`);
          } else {
            branchId = branch._id as Types.ObjectId;
          }
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await this.employeeModel.create({
        username,
        firstname,
        lastname,
        email,
        password: hashedPassword,
        personalPin,
        branchId,
        enabled: true,
        role: 'super-admin',
        language,
      });

      this.logger.log(`Super admin account created (${email}).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to bootstrap super admin account: ${message}`);
    }
  }
}
