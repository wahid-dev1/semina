import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Employees')
@Controller('employees')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiResponse({ status: 201, description: 'Employee created successfully' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  @ApiResponse({ status: 409, description: 'Employee with this username/email already exists' })
  async create(@Body() createEmployeeDto: CreateEmployeeDto, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.employeesService.create(createEmployeeDto, requesterId, ipAddress);
  }

  @Get()
  @ApiOperation({ summary: 'Get all employees' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch ID' })
  @ApiResponse({ status: 200, description: 'Employees retrieved successfully' })
  async findAll(@Query('branchId') branchId: string, @Req() req: any) {
    // If user is not admin, filter by their branch
    const userBranchId = req.user.branchId;
    const filterBranchId = req.user.role === 'admin' ? branchId : userBranchId;
    return this.employeesService.findAll(filterBranchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiResponse({ status: 200, description: 'Employee retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee' })
  @ApiResponse({ status: 200, description: 'Employee updated successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({ status: 409, description: 'Employee with this username/email already exists' })
  async update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.employeesService.update(id, updateEmployeeDto, requesterId, ipAddress);
  }

  @Patch(':id/change-password')
  @ApiOperation({ summary: 'Change employee password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async changePassword(@Param('id') id: string, @Body() changePasswordDto: ChangePasswordDto, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    await this.employeesService.changePassword(id, changePasswordDto, requesterId, ipAddress);
    return { message: 'Password changed successfully' };
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle employee status (enable/disable)' })
  @ApiResponse({ status: 200, description: 'Employee status updated successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async toggleStatus(@Param('id') id: string, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.employeesService.toggleStatus(id, requesterId, ipAddress);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete employee' })
  @ApiResponse({ status: 200, description: 'Employee deleted successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete your own account' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    await this.employeesService.remove(id, requesterId, ipAddress);
    return { message: 'Employee deleted successfully' };
  }
}
