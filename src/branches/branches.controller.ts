import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Branches')
@Controller('branches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new branch' })
  @ApiResponse({ status: 201, description: 'Branch created successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @ApiResponse({ status: 409, description: 'Branch with this email already exists' })
  async create(@Body() createBranchDto: CreateBranchDto, @Req() req: any) {
    const providerId = req.user.id; // Assuming user is a provider
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.branchesService.create(createBranchDto, providerId, ipAddress);
  }

  @Get()
  @ApiOperation({ summary: 'Get all branches' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
  @ApiResponse({ status: 200, description: 'Branches retrieved successfully' })
  async findAll(@Query('companyId') companyId: string, @Req() req: any) {
    const providerId = req.user.id; // Assuming user is a provider
    return this.branchesService.findAll(providerId, companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch by ID' })
  @ApiResponse({ status: 200, description: 'Branch retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const providerId = req.user.id; // Assuming user is a provider
    return this.branchesService.findOne(id, providerId);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get branch statistics' })
  @ApiResponse({ status: 200, description: 'Branch statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  async getStats(@Param('id') id: string, @Req() req: any) {
    const providerId = req.user.id; // Assuming user is a provider
    return this.branchesService.getBranchStats(id, providerId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update branch' })
  @ApiResponse({ status: 200, description: 'Branch updated successfully' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  @ApiResponse({ status: 409, description: 'Branch with this email already exists' })
  async update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto, @Req() req: any) {
    const providerId = req.user.id; // Assuming user is a provider
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.branchesService.update(id, updateBranchDto, providerId, ipAddress);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete branch' })
  @ApiResponse({ status: 200, description: 'Branch deleted successfully' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const providerId = req.user.id; // Assuming user is a provider
    const ipAddress = req.ip || req.connection.remoteAddress;
    await this.branchesService.remove(id, providerId, ipAddress);
    return { message: 'Branch deleted successfully' };
  }
}
