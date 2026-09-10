import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse.js';

export function validateProduct(req: Request, res: Response, next: NextFunction): void {
  const { product_name, sku, category, unit_price, current_stock, minimum_stock } = req.body;

  if (!product_name || typeof product_name !== 'string' || !product_name.trim()) {
    sendError(res, 'Product name is required.', 400);
    return;
  }

  if (!sku || typeof sku !== 'string' || !sku.trim()) {
    sendError(res, 'Product SKU is required.', 400);
    return;
  }

  if (!category || typeof category !== 'string' || !category.trim()) {
    sendError(res, 'Product category is required.', 400);
    return;
  }

  const priceNum = Number(unit_price);
  if (unit_price === undefined || isNaN(priceNum) || priceNum < 0) {
    sendError(res, 'Unit price must be a valid non-negative number.', 400);
    return;
  }

  if (current_stock !== undefined) {
    const stockNum = Number(current_stock);
    if (isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
      sendError(res, 'Current stock must be a non-negative integer.', 400);
      return;
    }
  }

  if (minimum_stock !== undefined) {
    const minStockNum = Number(minimum_stock);
    if (isNaN(minStockNum) || minStockNum < 0 || !Number.isInteger(minStockNum)) {
      sendError(res, 'Minimum stock must be a non-negative integer.', 400);
      return;
    }
  }

  next();
}
