import { api } from './api';
import { MovementType, PaginatedResult, StockMovement } from '../types';

export const stockService = {
  async getStockMovements(params?: {
    page?: number;
    limit?: number;
    product_id?: number;
    movement_type?: MovementType;
    start_date?: string;
    end_date?: string;
  }): Promise<PaginatedResult<StockMovement>> {
    const res = await api.get('/stock-movements', { params });
    return res.data.data;
  },

  async adjustStock(data: {
    product_id: number;
    quantity: number;
    movement_type: MovementType;
    reason: string;
  }): Promise<StockMovement> {
    const res = await api.post('/stock-movements/adjust', data);
    return res.data.data;
  },
};
