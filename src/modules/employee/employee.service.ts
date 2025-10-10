import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Employee, EmployeeDocument } from '../../schemas/employee.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    try {
      // Check if username or email already exists
      const existingEmployee = await this.employeeModel.findOne({
        $or: [
          { username: createEmployeeDto.username },
          { email: createEmployeeDto.email }
        ]
      });

      if (existingEmployee) {
        throw new ConflictException('Username or email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(createEmployeeDto.password, 10);

      const employee = new this.employeeModel({
        ...createEmployeeDto,
        password: hashedPassword,
      });

      return await employee.save();
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create employee');
    }
  }

  async findAll(branchId?: string): Promise<Employee[]> {
    const filter = branchId ? { branchId } : {};
    return await this.employeeModel.find(filter).populate('branchId').exec();
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeModel.findById(id).populate('branchId').exec();
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  async findByEmail(email: string): Promise<Employee | null> {
    return await this.employeeModel.findOne({ email }).populate('branchId').exec();
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
    try {
      // Check if username or email already exists (excluding current employee)
      if (updateEmployeeDto.username || updateEmployeeDto.email) {
        const existingEmployee = await this.employeeModel.findOne({
          _id: { $ne: id },
          $or: [
            ...(updateEmployeeDto.username ? [{ username: updateEmployeeDto.username }] : []),
            ...(updateEmployeeDto.email ? [{ email: updateEmployeeDto.email }] : [])
          ]
        });

        if (existingEmployee) {
          throw new ConflictException('Username or email already exists');
        }
      }

      const employee = await this.employeeModel.findByIdAndUpdate(
        id,
        updateEmployeeDto,
        { new: true, runValidators: true }
      ).populate('branchId').exec();

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      return employee;
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update employee');
    }
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const employee = await this.employeeModel.findById(id);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      employee.password
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    employee.password = hashedNewPassword;
    await employee.save();
  }

  async remove(id: string): Promise<void> {
    const result = await this.employeeModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Employee not found');
    }
  }

  async findByBranch(branchId: string): Promise<Employee[]> {
    return await this.employeeModel.find({ branchId }).populate('branchId').exec();
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.employeeModel.findByIdAndUpdate(id, { lastLogin: new Date() });
  }
}
