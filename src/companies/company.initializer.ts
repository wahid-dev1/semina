import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from '../schemas/company.schema';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { SAMINA_PROVIDER_ID } from '@/common/constants/samina.constants';

@Injectable()
export class CompanyInitializer implements OnApplicationBootstrap {
  private readonly logger = new Logger(CompanyInitializer.name);

  constructor(
    @InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>,
    private readonly companiesService: CompaniesService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.shouldBootstrap()) {
      this.logger.debug('Company bootstrap disabled via configuration.');
      return;
    }

    try {
      const hasCompany = await this.companyModel.exists({});
      if (hasCompany) {
        this.logger.debug('Company bootstrap skipped: company record already present.');
        return;
      }

      const companyDto = this.buildCompanyDto();
      if (!companyDto) {
        this.logger.warn('Company bootstrap skipped: incomplete INITIAL_COMPANY_* configuration.');
        return;
      }

      await this.companiesService.create(companyDto, SAMINA_PROVIDER_ID, 'bootstrap');
      this.logger.log(`Initial company "${companyDto.name}" created successfully.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to bootstrap initial company: ${message}`);
    }
  }

  private buildCompanyDto(): CreateCompanyDto | null {
    const name = this.configService.get<string>('INITIAL_COMPANY_NAME');
    const contactPerson = this.configService.get<string>('INITIAL_COMPANY_CONTACT_PERSON');
    const email = this.configService.get<string>('INITIAL_COMPANY_EMAIL');
    const phone = this.configService.get<string>('INITIAL_COMPANY_PHONE');
    const address = this.configService.get<string>('INITIAL_COMPANY_ADDRESS');
    const enabled = this.parseBoolean(
      this.configService.get<string>('INITIAL_COMPANY_ACTIVE'),
      true,
    );

    if (!name || !contactPerson || !email || !phone || !address) {
      return null;
    }

    return {
      name,
      contactPerson,
      email,
      phone,
      address,
      enabled,
    };
  }

  private shouldBootstrap(): boolean {
    return this.parseBoolean(this.configService.get<string>('INITIAL_COMPANY_ENABLED'), true);
  }

  private parseBoolean(value: string | undefined | null, defaultValue: boolean): boolean {
    if (value === undefined || value === null || value.trim() === '') {
      return defaultValue;
    }

    return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
  }
}
