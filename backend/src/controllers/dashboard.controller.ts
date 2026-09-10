import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

export class DashboardController {
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await dashboardService.getDashboardData();
      sendSuccess(res, 'Dashboard statistics retrieved.', data);
    } catch (err) {
      next(err);
    }
  }
}

export const dashboardController = new DashboardController();
