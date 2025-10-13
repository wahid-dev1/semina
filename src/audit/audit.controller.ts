import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Audit & Logs')
@Controller('audit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Get audit logs with filters' })
  @ApiQuery({ name: 'action', required: false, description: 'Filter by action' })
  @ApiQuery({ name: 'entity', required: false, description: 'Filter by entity' })
  @ApiQuery({ name: 'employeeId', required: false, description: 'Filter by employee ID' })
  @ApiQuery({ name: 'customerId', required: false, description: 'Filter by customer ID' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  async getLogs(
    @Query('action') action: string,
    @Query('entity') entity: string,
    @Query('employeeId') employeeId: string,
    @Query('customerId') customerId: string,
    @Query('branchId') branchId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Req() req: any
  ) {
    const userBranchId = req.user.branchId;
    const canAccessAllBranches = ['admin', 'super-admin'].includes(req.user.role);
    const filterBranchId = canAccessAllBranches ? branchId : userBranchId;

    const filters = {
      action,
      entity,
      employeeId,
      customerId,
      branchId: filterBranchId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    };

    return this.auditService.findAll(filters);
  }

  @Get('entity/:entity/:entityId')
  @ApiOperation({ summary: 'Get audit logs for a specific entity' })
  @ApiResponse({ status: 200, description: 'Entity audit logs retrieved successfully' })
  async getEntityLogs(
    @Query('entity') entity: string,
    @Query('entityId') entityId: string
  ) {
    return this.auditService.findByEntity(entity, entityId);
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get audit logs for a specific employee' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  @ApiResponse({ status: 200, description: 'Employee audit logs retrieved successfully' })
  async getEmployeeLogs(
    @Query('employeeId') employeeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.auditService.findByEmployee(
      employeeId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('branch/:branchId')
  @ApiOperation({ summary: 'Get audit logs for a specific branch' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  @ApiResponse({ status: 200, description: 'Branch audit logs retrieved successfully' })
  async getBranchLogs(
    @Query('branchId') branchId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.auditService.findByBranch(
      branchId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get audit statistics' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  @ApiResponse({ status: 200, description: 'Audit statistics retrieved successfully' })
  async getStats(
    @Query('branchId') branchId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any
  ) {
    const userBranchId = req.user.branchId;
    const canAccessAllBranches = ['admin', 'super-admin'].includes(req.user.role);
    const filterBranchId = canAccessAllBranches ? branchId : userBranchId;

    return this.auditService.getAuditStats(
      filterBranchId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('timeline')
  @ApiOperation({ summary: 'Get activity timeline' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch ID' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to include' })
  @ApiResponse({ status: 200, description: 'Activity timeline retrieved successfully' })
  async getTimeline(
    @Query('branchId') branchId: string,
    @Query('days') days: string,
    @Req() req: any
  ) {
    const userBranchId = req.user.branchId;
    const canAccessAllBranches = ['admin', 'super-admin'].includes(req.user.role);
    const filterBranchId = canAccessAllBranches ? branchId : userBranchId;
    const daysNum = days ? parseInt(days, 10) : 7;

    return this.auditService.getActivityTimeline(filterBranchId, daysNum);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export audit logs' })
  @ApiQuery({ name: 'action', required: false, description: 'Filter by action' })
  @ApiQuery({ name: 'entity', required: false, description: 'Filter by entity' })
  @ApiQuery({ name: 'employeeId', required: false, description: 'Filter by employee ID' })
  @ApiQuery({ name: 'customerId', required: false, description: 'Filter by customer ID' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  @ApiResponse({ status: 200, description: 'Audit logs exported successfully' })
  async exportLogs(
    @Query('action') action: string,
    @Query('entity') entity: string,
    @Query('employeeId') employeeId: string,
    @Query('customerId') customerId: string,
    @Query('branchId') branchId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any
  ) {
    const userBranchId = req.user.branchId;
    const canAccessAllBranches = ['admin', 'super-admin'].includes(req.user.role);
    const filterBranchId = canAccessAllBranches ? branchId : userBranchId;

    const filters = {
      action,
      entity,
      employeeId,
      customerId,
      branchId: filterBranchId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.auditService.exportAuditLogs(filters);
  }
}
