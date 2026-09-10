import { api } from './api';
import { Challan, PaginatedResult } from '../types';

export interface CreateChallanPayload {
  customer_id: number;
  items: {
    product_id: number;
    quantity: number;
  }[];
  status?: 'DRAFT' | 'CONFIRMED';
}

export const challanService = {
  async getChallans(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<PaginatedResult<Challan>> {
    const res = await api.get('/challans', { params });
    return res.data.data;
  },

  async getChallanById(id: number): Promise<Challan> {
    const res = await api.get(`/challans/${id}`);
    return res.data.data;
  },

  async createChallan(payload: CreateChallanPayload): Promise<Challan> {
    const res = await api.post('/challans', payload);
    return res.data.data;
  },

  async confirmChallan(id: number): Promise<Challan> {
    const res = await api.put(`/challans/${id}/confirm`);
    return res.data.data;
  },

  async cancelChallan(id: number): Promise<Challan> {
    const res = await api.put(`/challans/${id}/cancel`);
    return res.data.data;
  },
};
