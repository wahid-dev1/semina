import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  @ApiResponse({ status: 409, description: 'Customer with this email already exists in this branch' })
  async create(@Body() createCustomerDto: CreateCustomerDto, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.customersService.create(createCustomerDto, requesterId, ipAddress);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch ID' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or email' })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  async findAll(
    @Query('branchId') branchId: string,
    @Query('search') search: string,
    @Req() req: any
  ) {
    // If user is not admin, filter by their branch
    const userBranchId = req.user.branchId;
    const canAccessAllBranches = ['admin', 'super-admin'].includes(req.user.role);
    const filterBranchId = canAccessAllBranches ? branchId : userBranchId;
    return this.customersService.findAll(filterBranchId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Get(':id/medical-history')
  @ApiOperation({ summary: 'Get customer medical history' })
  @ApiResponse({ status: 200, description: 'Medical history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getMedicalHistory(@Param('id') id: string) {
    return this.customersService.getMedicalHistory(id);
  }

  @Get(':id/orders')
  @ApiOperation({ summary: 'Get customer orders' })
  @ApiResponse({ status: 200, description: 'Customer orders retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getOrders(@Param('id') id: string) {
    return this.customersService.getOrders(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get customer statistics' })
  @ApiResponse({ status: 200, description: 'Customer statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getStats(@Param('id') id: string) {
    return this.customersService.getCustomerStats(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 409, description: 'Customer with this email already exists in this branch' })
  async update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.customersService.update(id, updateCustomerDto, requesterId, ipAddress);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customer' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete customer with existing orders' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    await this.customersService.remove(id, requesterId, ipAddress);
    return { message: 'Customer deleted successfully' };
  }
}
