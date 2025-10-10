import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MedicalFormService } from './medical-form.service';
import { SubmitMedicalFormDto } from './dto/submit-medical-form.dto';

@ApiTags('Medical Form')
@Controller('medical-form')
export class MedicalFormController {
  constructor(private readonly medicalFormService: MedicalFormService) {}

  @Post('submit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit medical form (public endpoint)' })
  @ApiResponse({ status: 201, description: 'Medical form submitted successfully' })
  @ApiResponse({ status: 404, description: 'Branch not found or disabled' })
  @ApiResponse({ status: 409, description: 'Customer with this email already exists in this branch' })
  async submitForm(@Body() submitMedicalFormDto: SubmitMedicalFormDto, @Param() req: any) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.medicalFormService.submitForm(submitMedicalFormDto, ipAddress);
  }

  @Get('options')
  @ApiOperation({ summary: 'Get form options (public endpoint)' })
  @ApiResponse({ status: 200, description: 'Form options retrieved successfully' })
  async getFormOptions() {
    return this.medicalFormService.getFormOptions();
  }

  @Get('validate-qr/:qrCode')
  @ApiOperation({ summary: 'Validate QR code (public endpoint)' })
  @ApiResponse({ status: 200, description: 'QR code validation result' })
  async validateQRCode(@Param('qrCode') qrCode: string) {
    const isValid = await this.medicalFormService.validateQRCode(qrCode);
    return { valid: isValid };
  }
}
