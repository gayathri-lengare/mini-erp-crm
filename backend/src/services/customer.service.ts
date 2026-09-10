import { customerRepository } from '../repositories/customer.repository.js';
import { Customer, FollowUp, PaginatedResult, PaginationParams } from '../types/index.js';
import { AppError } from '../middleware/error.middleware.js';

export class CustomerService {
  async getCustomers(params: PaginationParams): Promise<PaginatedResult<Customer>> {
    return customerRepository.findAll(params);
  }

  async getCustomerById(id: number): Promise<Customer> {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new AppError(`Customer with ID ${id} not found.`, 404);
    }
    return customer;
  }

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    return customerRepository.create(data);
  }

  async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
    const existing = await customerRepository.findById(id);
    if (!existing) {
      throw new AppError(`Customer with ID ${id} not found.`, 404);
    }
    const updated = await customerRepository.update(id, data);
    if (!updated) {
      throw new AppError(`Failed to update customer with ID ${id}.`, 400);
    }
    return updated;
  }

  async deleteCustomer(id: number): Promise<void> {
    const existing = await customerRepository.findById(id);
    if (!existing) {
      throw new AppError(`Customer with ID ${id} not found.`, 404);
    }
    const deleted = await customerRepository.delete(id);
    if (!deleted) {
      throw new AppError(`Failed to delete customer with ID ${id}.`, 400);
    }
  }

  async getFollowUps(customerId: number): Promise<FollowUp[]> {
    await this.getCustomerById(customerId); // Ensure customer exists
    return customerRepository.getFollowUps(customerId);
  }

  async addFollowUp(
    customerId: number,
    note: string,
    followUpDate: string | null,
    userId: number | null
  ): Promise<FollowUp> {
    await this.getCustomerById(customerId); // Ensure customer exists
    return customerRepository.addFollowUp(customerId, note, followUpDate, userId);
  }
}

export const customerService = new CustomerService();
