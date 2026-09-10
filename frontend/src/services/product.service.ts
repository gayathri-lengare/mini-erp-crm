import { api } from './api';
import { PaginatedResult, Product } from '../types';

export const productService = {
  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    low_stock?: boolean;
  }): Promise<PaginatedResult<Product>> {
    const res = await api.get('/products', { params });
    return res.data.data;
  },

  async getProductById(id: number): Promise<Product> {
    const res = await api.get(`/products/${id}`);
    return res.data.data;
  },

  async getCategories(): Promise<string[]> {
    const res = await api.get('/products/categories');
    return res.data.data;
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const res = await api.post('/products', data);
    return res.data.data;
  },

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const res = await api.put(`/products/${id}`, data);
    return res.data.data;
  },
};
