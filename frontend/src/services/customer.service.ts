import { api } from './api';
import { Customer, FollowUp, PaginatedResult } from '../types';

export const customerService = {
  async getCustomers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    customer_type?: string;
  }): Promise<PaginatedResult<Customer>> {
    const res = await api.get('/customers', { params });
    return res.data.data;
  },

  async getCustomerById(id: number): Promise<Customer> {
    const res = await api.get(`/customers/${id}`);
    return res.data.data;
  },

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    const res = await api.post('/customers', data);
    return res.data.data;
  },

  async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
    const res = await api.put(`/customers/${id}`, data);
    return res.data.data;
  },

  async deleteCustomer(id: number): Promise<void> {
    await api.delete(`/customers/${id}`);
  },

  async getFollowUps(customerId: number): Promise<FollowUp[]> {
    const res = await api.get(`/customers/${customerId}/follow-ups`);
    return res.data.data;
  },

  async addFollowUp(
    customerId: number,
    note: string,
    followUpDate: string | null
  ): Promise<FollowUp> {
    const res = await api.post(`/customers/${customerId}/follow-ups`, {
      note,
      follow_up_date: followUpDate,
    });
    return res.data.data;
  },
};
