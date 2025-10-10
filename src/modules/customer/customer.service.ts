import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from '../../schemas/customer.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    try {
      const customer = new this.customerModel(createCustomerDto);
      return await customer.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('Customer with this email already exists');
      }
      throw error;
    }
  }

  async findAll(branchId?: string): Promise<Customer[]> {
    const filter = branchId ? { branchId } : {};
    return await this.customerModel.find(filter).populate('branchId').exec();
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerModel.findById(id).populate('branchId').exec();
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return await this.customerModel.findOne({ email }).populate('branchId').exec();
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.customerModel.findByIdAndUpdate(id, { lastLogin: new Date() });
  }
}
