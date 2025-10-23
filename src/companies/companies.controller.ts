import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SAMINA_PROVIDER_ID } from '@/common/constants/samina.constants';

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
    const ipAddress = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
    return this.companiesService.create(createCompanyDto, SAMINA_PROVIDER_ID, ipAddress);
  }

  @Get()
  @ApiOperation({ summary: 'Get all companies' })
  @ApiResponse({ status: 200, description: 'Companies retrieved successfully' })
  async findAll() {
    return this.companiesService.findAll(SAMINA_PROVIDER_ID);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiResponse({ status: 200, description: 'Company retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id, SAMINA_PROVIDER_ID);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update company' })
  @ApiResponse({ status: 200, description: 'Company updated successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @ApiResponse({ status: 409, description: 'Company with this email already exists' })
  async update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto, @Req() req: any) {
    const ipAddress = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
    return this.companiesService.update(id, updateCompanyDto, SAMINA_PROVIDER_ID, ipAddress);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete company' })
  @ApiResponse({ status: 200, description: 'Company deleted successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const ipAddress = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
    await this.companiesService.remove(id, SAMINA_PROVIDER_ID, ipAddress);
    return { message: 'Company deleted successfully' };
  }
}
