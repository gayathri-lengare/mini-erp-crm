import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse.js';

export class AppError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number = 400, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Centralized error handler middleware.
 * Formats errors into standard { success: false, message: ... } responses
 * and shields sensitive stack traces from client exposure.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Known Application / Business logic error
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.details);
    return;
  }

  // PostgreSQL Database Unique Constraint Violation (Code 23505)
  if (err.code === '23505') {
    const detail = err.detail || 'A record with this unique value already exists.';
    sendError(res, `Duplicate field value: ${detail}`, 409);
    return;
  }

  // PostgreSQL Foreign Key Violation (Code 23503)
  if (err.code === '23503') {
    sendError(res, 'Referenced record does not exist or is still linked to other data.', 400);
    return;
  }

  // PostgreSQL Check Constraint Violation (Code 23514)
  if (err.code === '23514') {
    sendError(res, 'Database check constraint failed: Invalid field values provided.', 400);
    return;
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token provided.', 401);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Token has expired.', 401);
    return;
  }

  // Default / Unhandled 500 Server Error
  console.error('Unhandled Internal Error:', err);
  sendError(
    res,
    process.env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred.'
      : err.message || 'Internal Server Error',
    500
  );
}

/**
 * 404 Route Not Found Middleware
 */
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Endpoint '${req.method} ${req.originalUrl}' not found on this server.`, 404);
}
