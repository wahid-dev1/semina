import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  @ApiResponse({ status: 409, description: 'Product with this name already exists in this scope' })
  async create(@Body() createProductDto: CreateProductDto, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.productsService.create(createProductDto, requesterId, ipAddress);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch ID' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by product type' })
  @ApiQuery({ name: 'active', required: false, description: 'Filter by active status' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
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
    
    return this.productsService.findAll(filterBranchId, type, activeFilter);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get product statistics' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch ID' })
  @ApiResponse({ status: 200, description: 'Product statistics retrieved successfully' })
  async getStats(@Query('branchId') branchId: string, @Req() req: any) {
    const userBranchId = req.user.branchId;
    const canAccessAllBranches = ['admin', 'super-admin'].includes(req.user.role);
    const filterBranchId = canAccessAllBranches ? branchId : userBranchId;
    
    return this.productsService.getProductStats(filterBranchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Product with this name already exists in this scope' })
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.productsService.update(id, updateProductDto, requesterId, ipAddress);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle product status (activate/deactivate)' })
  @ApiResponse({ status: 200, description: 'Product status updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async toggleStatus(@Param('id') id: string, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.productsService.toggleStatus(id, requesterId, ipAddress);
  }

  @Get(':id/remaining-services')
  @ApiOperation({ summary: 'Get remaining services for a product bundle' })
  @ApiResponse({ status: 200, description: 'Remaining services retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getRemainingServices(@Param('id') id: string) {
    return this.productsService.getRemainingServices(id);
  }

  @Post(':id/use-service')
  @ApiOperation({ summary: 'Use a service from a product bundle' })
  @ApiResponse({ status: 200, description: 'Service used successfully' })
  @ApiResponse({ status: 404, description: 'Product or service not found' })
  @ApiResponse({ status: 409, description: 'Not enough remaining quantity' })
  async useService(
    @Param('id') productId: string,
    @Body() body: { serviceId: string; quantity: number; customerId: string; orderId: string },
    @Req() req: any
  ) {
    const employeeId = req.user.id;
    const branchId = req.user.branchId;
    return this.productsService.useService(
      productId,
      body.serviceId,
      body.quantity,
      body.customerId,
      body.orderId,
      branchId,
      employeeId
    );
  }

  @Post('use-service-from-order')
  @ApiOperation({ summary: 'Use a service from an order containing product bundles' })
  @ApiResponse({ status: 200, description: 'Service used successfully' })
  @ApiResponse({ status: 404, description: 'Order or service not found' })
  @ApiResponse({ status: 409, description: 'Not enough remaining quantity' })
  async useServiceFromOrder(
    @Body() body: { orderId: string; serviceId: string; quantity: number; customerId: string },
    @Req() req: any
  ) {
    const employeeId = req.user.id;
    const branchId = req.user.branchId;
    return this.productsService.useServiceFromOrder(
      body.orderId,
      body.serviceId,
      body.quantity,
      body.customerId,
      branchId,
      employeeId
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const requesterId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    await this.productsService.remove(id, requesterId, ipAddress);
    return { message: 'Product deleted successfully' };
  }
}
