import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MedicalFormService } from './medical-form.service';
import { SubmitMedicalFormDto } from './dto/submit-medical-form.dto';

@ApiTags('Medical Form')
@Controller('medical-form')
export class MedicalFormController {
  constructor(private readonly medicalFormService: MedicalFormService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Submit medical history form' })
  @ApiResponse({ status: 201, description: 'Medical form submitted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async submitForm(@Body() submitMedicalFormDto: SubmitMedicalFormDto) {
    return this.medicalFormService.submitForm(submitMedicalFormDto);
  }

  @Get('options')
  @ApiOperation({ summary: 'Get form options and dropdown values' })
  @ApiResponse({ status: 200, description: 'Form options retrieved successfully' })
  async getFormOptions() {
    return this.medicalFormService.getFormOptions();
  }
}
