import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse.js';

const VALID_CUSTOMER_TYPES = ['Retail', 'Wholesale', 'Distributor'];
const VALID_CUSTOMER_STATUSES = ['Lead', 'Active', 'Inactive'];

export function validateCustomer(req: Request, res: Response, next: NextFunction): void {
  const { customer_name, mobile, email, customer_type, status } = req.body;

  if (!customer_name || typeof customer_name !== 'string' || !customer_name.trim()) {
    sendError(res, 'Customer name is required.', 400);
    return;
  }

  if (!mobile || typeof mobile !== 'string' || !mobile.trim()) {
    sendError(res, 'Mobile number is required.', 400);
    return;
  }

  if (mobile.trim().length < 7 || mobile.trim().length > 20) {
    sendError(res, 'Mobile number must be between 7 and 20 characters.', 400);
    return;
  }

  if (email && typeof email === 'string' && email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      sendError(res, 'Invalid email format.', 400);
      return;
    }
  }

  if (customer_type && !VALID_CUSTOMER_TYPES.includes(customer_type)) {
    sendError(
      res,
      `Invalid customer type. Must be one of: ${VALID_CUSTOMER_TYPES.join(', ')}`,
      400
    );
    return;
  }

  if (status && !VALID_CUSTOMER_STATUSES.includes(status)) {
    sendError(
      res,
      `Invalid customer status. Must be one of: ${VALID_CUSTOMER_STATUSES.join(', ')}`,
      400
    );
    return;
  }

  next();
}

export function validateFollowUp(req: Request, res: Response, next: NextFunction): void {
  const { note } = req.body;

  if (!note || typeof note !== 'string' || !note.trim()) {
    sendError(res, 'Follow-up note is required.', 400);
    return;
  }

  next();
}
