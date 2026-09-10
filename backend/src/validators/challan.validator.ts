import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse.js';

export function validateCreateChallan(req: Request, res: Response, next: NextFunction): void {
  const { customer_id, items, status } = req.body;

  if (!customer_id || isNaN(Number(customer_id))) {
    sendError(res, 'A valid customer_id is required to create a challan.', 400);
    return;
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    sendError(res, 'Challan must contain at least one product item.', 400);
    return;
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.product_id || isNaN(Number(item.product_id))) {
      sendError(res, `Item at index ${i} is missing a valid product_id.`, 400);
      return;
    }

    const qty = Number(item.quantity);
    if (!qty || isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      sendError(res, `Item at index ${i} must have a positive integer quantity (received: ${item.quantity}).`, 400);
      return;
    }
  }

  if (status && !['DRAFT', 'CONFIRMED'].includes(status)) {
    sendError(res, 'Status upon creation can only be DRAFT or CONFIRMED.', 400);
    return;
  }

  next();
}
