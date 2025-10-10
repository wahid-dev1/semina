import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @ApiResponse({ status: 400, description: 'Invalid subscription data' })
  async create(@Body() createSubscriptionDto: CreateSubscriptionDto, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.subscriptionsService.create(createSubscriptionDto, requesterId, ipAddress);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions' })
  @ApiQuery({ name: 'franchiseId', required: false, description: 'Filter by franchise ID' })
  @ApiQuery({ name: 'active', required: false, description: 'Filter by active status' })
  @ApiResponse({ status: 200, description: 'Subscriptions retrieved successfully' })
  async findAll(
    @Query('franchiseId') franchiseId: string,
    @Query('active') active: string,
    @Req() req: any
  ) {
    const activeFilter = active ? active === 'true' : undefined;
    return this.subscriptionsService.findAll(franchiseId, activeFilter);
  }

  @Get('active/:franchiseId')
  @ApiOperation({ summary: 'Get active subscriptions for a franchise' })
  @ApiResponse({ status: 200, description: 'Active subscriptions retrieved successfully' })
  async getActiveSubscriptions(@Param('franchiseId') franchiseId: string) {
    return this.subscriptionsService.getActiveSubscriptions(franchiseId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get subscription statistics' })
  @ApiQuery({ name: 'franchiseId', required: false, description: 'Filter by franchise ID' })
  @ApiResponse({ status: 200, description: 'Subscription statistics retrieved successfully' })
  async getStats(@Query('franchiseId') franchiseId: string) {
    return this.subscriptionsService.getSubscriptionStats(franchiseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiResponse({ status: 200, description: 'Subscription retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update subscription' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({ status: 400, description: 'Invalid subscription data' })
  async update(@Param('id') id: string, @Body() updateSubscriptionDto: UpdateSubscriptionDto, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.subscriptionsService.update(id, updateSubscriptionDto, requesterId, ipAddress);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle subscription status (activate/deactivate)' })
  @ApiResponse({ status: 200, description: 'Subscription status updated successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async toggleStatus(@Param('id') id: string, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.subscriptionsService.toggleStatus(id, requesterId, ipAddress);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete subscription' })
  @ApiResponse({ status: 200, description: 'Subscription deleted successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    await this.subscriptionsService.remove(id, requesterId, ipAddress);
    return { message: 'Subscription deleted successfully' };
  }
}
