import { api } from './api';
import { DashboardStats, User } from '../types';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const res = await api.get('/dashboard/stats');
    return res.data.data;
  },
};

export const userService = {
  async getUsers(): Promise<User[]> {
    const res = await api.get('/users');
    return res.data.data;
  },

  async createUser(data: { name: string; email: string; password: string; role: string }): Promise<User> {
    const res = await api.post('/users', data);
    return res.data.data;
  },
};
