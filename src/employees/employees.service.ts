import { Injectable, NotFoundException, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Employee, EmployeeDocument } from '../schemas/employee.schema';
import { Branch, BranchDocument } from '../schemas/branch.schema';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto, requesterId: string, ipAddress: string): Promise<Employee> {
    if (createEmployeeDto.role !== 'super-admin' && !createEmployeeDto.branchId) {
      throw new BadRequestException('Branch is required for non super-admin employees');
    }

    // Verify branch exists when provided
    if (createEmployeeDto.branchId) {
      const branch = await this.branchModel.findById(createEmployeeDto.branchId).exec();
      if (!branch) {
        throw new NotFoundException('Branch not found');
      }
    }

    // Check if employee with same username already exists
    const existingEmployeeByUsername = await this.employeeModel.findOne({ 
      username: createEmployeeDto.username 
    }).exec();
    if (existingEmployeeByUsername) {
      throw new ConflictException('Employee with this username already exists');
    }

    // Check if employee with same email already exists
    const existingEmployeeByEmail = await this.employeeModel.findOne({ 
      email: createEmployeeDto.email 
    }).exec();
    if (existingEmployeeByEmail) {
      throw new ConflictException('Employee with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createEmployeeDto.password, 10);

    const employee = new this.employeeModel({
      ...createEmployeeDto,
      password: hashedPassword,
    });

    const savedEmployee = await employee.save();

    // Log creation
    await this.auditLogModel.create({
      action: 'CREATE',
      entity: 'Employee',
      entityId: savedEmployee._id,
      employeeId: requesterId,
      branchId: createEmployeeDto.branchId,
      newValues: { ...savedEmployee.toObject(), password: '[HIDDEN]' },
      ipAddress,
    });

    return savedEmployee;
  }

  async findAll(branchId?: string): Promise<Employee[]> {
    const filter = branchId ? { branchId } : {};
    return this.employeeModel.find(filter).populate('branchId', 'branchName').exec();
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeModel.findById(id).populate('branchId', 'branchName').exec();
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  async findByBranch(branchId: string): Promise<Employee[]> {
    return this.employeeModel.find({ branchId }).populate('branchId', 'branchName').exec();
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto, requesterId: string, ipAddress: string): Promise<Employee> {
    const employee = await this.employeeModel.findById(id).exec();
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Check if username is being changed and if it already exists
    if (updateEmployeeDto.username && updateEmployeeDto.username !== employee.username) {
      const existingEmployee = await this.employeeModel.findOne({ 
        username: updateEmployeeDto.username,
        _id: { $ne: id }
      }).exec();
      if (existingEmployee) {
        throw new ConflictException('Employee with this username already exists');
      }
    }

    // Check if email is being changed and if it already exists
    if (updateEmployeeDto.email && updateEmployeeDto.email !== employee.email) {
      const existingEmployee = await this.employeeModel.findOne({ 
        email: updateEmployeeDto.email,
        _id: { $ne: id }
      }).exec();
      if (existingEmployee) {
        throw new ConflictException('Employee with this email already exists');
      }
    }

    const oldValues = { ...employee.toObject(), password: '[HIDDEN]' };
    Object.assign(employee, updateEmployeeDto);

    if (employee.role !== 'super-admin' && !employee.branchId) {
      throw new BadRequestException('Branch is required for non super-admin employees');
    }

    const updatedEmployee = await employee.save();

    // Log update
    await this.auditLogModel.create({
      action: 'UPDATE',
      entity: 'Employee',
      entityId: employee._id,
      employeeId: requesterId,
      branchId: employee.branchId,
      oldValues,
      newValues: { ...updatedEmployee.toObject(), password: '[HIDDEN]' },
      ipAddress,
    });

    return updatedEmployee;
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto, requesterId: string, ipAddress: string): Promise<void> {
    const employee = await this.employeeModel.findById(id).exec();
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, employee.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    
    const oldValues = { ...employee.toObject(), password: '[HIDDEN]' };
    employee.password = hashedNewPassword;
    await employee.save();

    // Log password change
    await this.auditLogModel.create({
      action: 'CHANGE_PASSWORD',
      entity: 'Employee',
      entityId: employee._id,
      employeeId: requesterId,
      branchId: employee.branchId,
      oldValues,
      newValues: { ...employee.toObject(), password: '[HIDDEN]' },
      ipAddress,
    });
  }

  async remove(id: string, requesterId: string, ipAddress: string): Promise<void> {
    const employee = await this.employeeModel.findById(id).exec();
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Check if trying to delete self
    if (id === requesterId) {
      throw new ConflictException('Cannot delete your own account');
    }

    // Check if employee has any active sessions or related data
    // Note: In a real implementation, you'd check for related data here

    await this.employeeModel.findByIdAndDelete(id).exec();

    // Log deletion
    await this.auditLogModel.create({
      action: 'DELETE',
      entity: 'Employee',
      entityId: employee._id,
      employeeId: requesterId,
      branchId: employee.branchId,
      oldValues: { ...employee.toObject(), password: '[HIDDEN]' },
      ipAddress,
    });
  }

  async toggleStatus(id: string, requesterId: string, ipAddress: string): Promise<Employee> {
    const employee = await this.employeeModel.findById(id).exec();
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const oldValues = { ...employee.toObject(), password: '[HIDDEN]' };
    employee.enabled = !employee.enabled;
    const updatedEmployee = await employee.save();

    // Log status change
    await this.auditLogModel.create({
      action: employee.enabled ? 'ENABLE' : 'DISABLE',
      entity: 'Employee',
      entityId: employee._id,
      employeeId: requesterId,
      branchId: employee.branchId,
      oldValues,
      newValues: { ...updatedEmployee.toObject(), password: '[HIDDEN]' },
      ipAddress,
    });

    return updatedEmployee;
  }
}
