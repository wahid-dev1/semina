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
  @ApiResponse({ status: 404, description: 'Company not found' })
  @ApiResponse({ status: 409, description: 'Service with this name already exists in this company' })
  async create(@Body() createServiceDto: CreateServiceDto, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.servicesService.create(createServiceDto, requesterId, ipAddress);
  }

  @Get()
  @ApiOperation({ summary: 'Get all services' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by service type' })
  @ApiQuery({ name: 'active', required: false, description: 'Filter by active status' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  async findAll(
    @Query('companyId') companyId: string,
    @Query('type') type: string,
    @Query('active') active: string,
    @Req() req: any
  ) {
    const userCompanyId = req.user.companyId;
    const filterCompanyId = req.user.role === 'admin' ? companyId : userCompanyId;
    const activeFilter = active ? active === 'true' : undefined;
    
    return this.servicesService.findAll(filterCompanyId, type, activeFilter);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get service statistics' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
  @ApiResponse({ status: 200, description: 'Service statistics retrieved successfully' })
  async getStats(@Query('companyId') companyId: string, @Req() req: any) {
    const userCompanyId = req.user.companyId;
    const filterCompanyId = req.user.role === 'admin' ? companyId : userCompanyId;
    
    return this.servicesService.getServiceStats(filterCompanyId);
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
  @ApiResponse({ status: 409, description: 'Service with this name already exists in this company' })
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
