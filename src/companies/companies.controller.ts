import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Companies')
@Controller('companies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({ status: 201, description: 'Company created successfully' })
  @ApiResponse({ status: 409, description: 'Company with this email already exists' })
  async create(@Body() createCompanyDto: CreateCompanyDto, @Req() req: any) {
    const providerId = req.user.id; // Assuming user is a provider
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.companiesService.create(createCompanyDto, providerId, ipAddress);
  }

  @Get()
  @ApiOperation({ summary: 'Get all companies' })
  @ApiResponse({ status: 200, description: 'Companies retrieved successfully' })
  async findAll(@Req() req: any) {
    const providerId = req.user.id; // Assuming user is a provider
    return this.companiesService.findAll(providerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiResponse({ status: 200, description: 'Company retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const providerId = req.user.id; // Assuming user is a provider
    return this.companiesService.findOne(id, providerId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update company' })
  @ApiResponse({ status: 200, description: 'Company updated successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @ApiResponse({ status: 409, description: 'Company with this email already exists' })
  async update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto, @Req() req: any) {
    const providerId = req.user.id; // Assuming user is a provider
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.companiesService.update(id, updateCompanyDto, providerId, ipAddress);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete company' })
  @ApiResponse({ status: 200, description: 'Company deleted successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const providerId = req.user.id; // Assuming user is a provider
    const ipAddress = req.ip || req.connection.remoteAddress;
    await this.companiesService.remove(id, providerId, ipAddress);
    return { message: 'Company deleted successfully' };
  }
}
