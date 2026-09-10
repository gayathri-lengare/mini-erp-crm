import { Request, Response, NextFunction } from 'express';
import { stockService } from '../services/stock.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { MovementType } from '../types/index.js';

export class StockController {
  async getStockMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, product_id, movement_type, start_date, end_date } = req.query;

      const result = await stockService.getStockMovements({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        product_id: product_id ? parseInt(product_id as string, 10) : undefined,
        movement_type: movement_type as MovementType,
        start_date: start_date as string,
        end_date: end_date as string,
      });

      sendSuccess(res, 'Stock movements retrieved successfully.', result);
    } catch (err) {
      next(err);
    }
  }

  async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { product_id, quantity, movement_type, reason } = req.body;
      const userId = req.user?.id || null;

      const movement = await stockService.adjustStock({
        product_id: parseInt(product_id, 10),
        quantity: parseInt(quantity, 10),
        movement_type,
        reason,
        created_by: userId,
      });

      sendSuccess(res, 'Stock adjustment recorded successfully.', movement, 201);
    } catch (err) {
      next(err);
    }
  }
}

export const stockController = new StockController();
