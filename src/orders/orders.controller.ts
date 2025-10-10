import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 404, description: 'Customer or product not found' })
  async create(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    const requesterId = req.user.id;
    const branchId = req.user.branchId;
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.ordersService.create(createOrderDto, requesterId, branchId, ipAddress);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch ID' })
  @ApiQuery({ name: 'customerId', required: false, description: 'Filter by customer ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async findAll(
    @Query('branchId') branchId: string,
    @Query('customerId') customerId: string,
    @Query('status') status: string,
    @Req() req: any
  ) {
    // If user is not admin, filter by their branch
    const userBranchId = req.user.branchId;
    const filterBranchId = req.user.role === 'admin' ? branchId : userBranchId;
    return this.ordersService.findAll(filterBranchId, customerId, status);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  @ApiResponse({ status: 200, description: 'Order statistics retrieved successfully' })
  async getStats(
    @Query('branchId') branchId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any
  ) {
    const userBranchId = req.user.branchId;
    const filterBranchId = req.user.role === 'admin' ? branchId : userBranchId;
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return this.ordersService.getOrderStats(filterBranchId, start, end);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent orders' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of orders to return' })
  @ApiResponse({ status: 200, description: 'Recent orders retrieved successfully' })
  async getRecentOrders(
    @Query('branchId') branchId: string,
    @Query('limit') limit: string,
    @Req() req: any
  ) {
    const userBranchId = req.user.branchId;
    const filterBranchId = req.user.role === 'admin' ? branchId : userBranchId;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    
    return this.ordersService.getRecentOrders(filterBranchId, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Cannot update paid or canceled order' })
  async update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.ordersService.update(id, updateOrderDto, requesterId, ipAddress);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateStatus(
    @Param('id') id: string, 
    @Body('status') status: 'pending' | 'paid' | 'canceled', 
    @Req() req: any
  ) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.ordersService.updateStatus(id, status, requesterId, ipAddress);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete order' })
  @ApiResponse({ status: 200, description: 'Order deleted successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete paid order' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    await this.ordersService.remove(id, requesterId, ipAddress);
    return { message: 'Order deleted successfully' };
  }
}
