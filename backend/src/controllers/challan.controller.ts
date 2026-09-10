import { Request, Response, NextFunction } from 'express';
import { challanService } from '../services/challan.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

export class ChallanController {
  async getChallans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, status } = req.query;
      const result = await challanService.getChallans({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string,
        status: status as string,
      });
      sendSuccess(res, 'Challans retrieved successfully.', result);
    } catch (err) {
      next(err);
    }
  }

  async getChallanById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const challan = await challanService.getChallanById(id);
      sendSuccess(res, 'Challan details retrieved successfully.', challan);
    } catch (err) {
      next(err);
    }
  }

  async createChallan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || null;
      const challan = await challanService.createChallan(req.body, userId);
      const msg =
        challan.status === 'CONFIRMED'
          ? 'Challan created and confirmed successfully. Inventory has been deducted.'
          : 'Challan saved as Draft. Inventory has not been changed.';
      sendSuccess(res, msg, challan, 201);
    } catch (err) {
      next(err);
    }
  }

  async confirmChallan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user?.id || null;
      const challan = await challanService.confirmChallan(id, userId);
      sendSuccess(
        res,
        `Challan ${challan.challan_number} confirmed successfully. Inventory stock has been deducted.`,
        challan
      );
    } catch (err) {
      next(err);
    }
  }

  async cancelChallan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user?.id || null;
      const challan = await challanService.cancelChallan(id, userId);
      sendSuccess(res, `Challan ${challan.challan_number} has been cancelled.`, challan);
    } catch (err) {
      next(err);
    }
  }
}

export const challanController = new ChallanController();
