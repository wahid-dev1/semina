import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch ID' })
  @ApiResponse({ status: 200, description: 'Dashboard summary retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSummary(@Query('branchId') branchId?: string) {
    return this.dashboardService.getSummary(branchId);
  }

  @Get('branch-stats')
  @Roles('admin')
  @ApiOperation({ summary: 'Get branch statistics' })
  @ApiResponse({ status: 200, description: 'Branch statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getBranchStats() {
    return this.dashboardService.getBranchStats();
  }

  @Get('workload')
  @ApiOperation({ summary: 'Get workload per weekday' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch ID' })
  @ApiResponse({ status: 200, description: 'Workload data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWorkloadPerWeekday(@Query('branchId') branchId?: string) {
    return this.dashboardService.getWorkloadPerWeekday(branchId);
  }

  @Get('active-customers')
  @ApiOperation({ summary: 'Get most active customers' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of customers to return', type: Number })
  @ApiResponse({ status: 200, description: 'Active customers retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMostActiveCustomers(
    @Query('branchId') branchId?: string,
    @Query('limit') limit?: number
  ) {
    return this.dashboardService.getMostActiveCustomers(branchId, limit);
  }
}
