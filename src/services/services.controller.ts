import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Services')
@Controller('services')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  @ApiResponse({ status: 409, description: 'Service with this name already exists in this branch' })
  async create(@Body() createServiceDto: CreateServiceDto, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.servicesService.create(createServiceDto, requesterId, ipAddress);
  }

  @Get()
  @ApiOperation({ summary: 'Get all services' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch ID' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by service type' })
  @ApiQuery({ name: 'active', required: false, description: 'Filter by active status' })
  @ApiResponse({ status: 200, description: 'ddServices retrieved successfully' })
  async findAll(
    @Query('branchId') branchId: string,
    @Query('type') type: string,
    @Query('active') active: string,
    @Req() req: any
  ) {
    const userBranchId = req.user.branchId;
    const canAccessAllBranches = ['admin', 'super-admin'].includes(req.user.role);
    const filterBranchId = canAccessAllBranches ? branchId : userBranchId;
    const activeFilter = active ? active === 'true' : undefined;
    
    return this.servicesService.findAll(filterBranchId, type, activeFilter);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get service statistics' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch ID' })
  @ApiResponse({ status: 200, description: 'Service statistics retrieved successfully' })
  async getStats(@Query('branchId') branchId: string, @Req() req: any) {
    const userBranchId = req.user.branchId;
    const canAccessAllBranches = ['admin', 'super-admin'].includes(req.user.role);
    const filterBranchId = canAccessAllBranches ? branchId : userBranchId;
    
    return this.servicesService.getServiceStats(filterBranchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiResponse({ status: 200, description: 'Service retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update service' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 409, description: 'Service with this name already exists in this branch' })
  async update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.servicesService.update(id, updateServiceDto, requesterId, ipAddress);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle service status (activate/deactivate)' })
  @ApiResponse({ status: 200, description: 'Service status updated successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async toggleStatus(@Param('id') id: string, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.servicesService.toggleStatus(id, requesterId, ipAddress);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete service' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    await this.servicesService.remove(id, requesterId, ipAddress);
    return { message: 'Service deleted successfully' };
  }
}
