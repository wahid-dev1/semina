import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch ID' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
  @ApiResponse({ status: 200, description: 'Dashboard summary retrieved successfully' })
  async getSummary(
    @Query('branchId') branchId: string,
    @Query('companyId') companyId: string,
    @Req() req: any
  ) {
    // If user is not admin, filter by their branch
    const userBranchId = req.user.branchId;
    const canAccessAllBranches = ['admin', 'super-admin'].includes(req.user.role);
    const filterBranchId = canAccessAllBranches ? branchId : userBranchId;
    
    return this.dashboardService.getSummary(filterBranchId, companyId);
  }

  @Get('branch-stats/:branchId')
  @ApiOperation({ summary: 'Get branch statistics' })
  @ApiResponse({ status: 200, description: 'Branch statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  async getBranchStats(@Query('branchId') branchId: string) {
    return this.dashboardService.getBranchStats(branchId);
  }

  @Get('recent-logins')
  @ApiOperation({ summary: 'Get recent employee logins' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of logins to return' })
  @ApiResponse({ status: 200, description: 'Recent logins retrieved successfully' })
  async getRecentLogins(
    @Query('branchId') branchId: string,
    @Query('limit') limit: string,
    @Req() req: any
  ) {
    const userBranchId = req.user.branchId;
    const canAccessAllBranches = ['admin', 'super-admin'].includes(req.user.role);
    const filterBranchId = canAccessAllBranches ? branchId : userBranchId;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    
    return this.dashboardService.getRecentLogins(filterBranchId, limitNum);
  }

  @Get('revenue-chart')
  @ApiOperation({ summary: 'Get revenue chart data' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch ID' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to include' })
  @ApiResponse({ status: 200, description: 'Revenue chart data retrieved successfully' })
  async getRevenueChart(
    @Query('branchId') branchId: string,
    @Query('days') days: string,
    @Req() req: any
  ) {
    const userBranchId = req.user.branchId;
    const canAccessAllBranches = ['admin', 'super-admin'].includes(req.user.role);
    const filterBranchId = canAccessAllBranches ? branchId : userBranchId;
    const daysNum = days ? parseInt(days, 10) : 30;
    
    return this.dashboardService.getRevenueChart(filterBranchId, daysNum);
  }

  @Get('product-performance')
  @ApiOperation({ summary: 'Get product performance data' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of products to return' })
  @ApiResponse({ status: 200, description: 'Product performance data retrieved successfully' })
  async getProductPerformance(
    @Query('branchId') branchId: string,
    @Query('limit') limit: string,
    @Req() req: any
  ) {
    const userBranchId = req.user.branchId;
    const canAccessAllBranches = ['admin', 'super-admin'].includes(req.user.role);
    const filterBranchId = canAccessAllBranches ? branchId : userBranchId;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    
    return this.dashboardService.getProductPerformance(filterBranchId, limitNum);
  }

  @Get('customer-growth')
  @ApiOperation({ summary: 'Get customer growth data' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch ID' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to include' })
  @ApiResponse({ status: 200, description: 'Customer growth data retrieved successfully' })
  async getCustomerGrowth(
    @Query('branchId') branchId: string,
    @Query('days') days: string,
    @Req() req: any
  ) {
    const userBranchId = req.user.branchId;
    const canAccessAllBranches = ['admin', 'super-admin'].includes(req.user.role);
    const filterBranchId = canAccessAllBranches ? branchId : userBranchId;
    const daysNum = days ? parseInt(days, 10) : 30;
    
    return this.dashboardService.getCustomerGrowth(filterBranchId, daysNum);
  }
}
