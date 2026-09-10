import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

export function sendSuccess<T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
  };
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = 400,
  errors?: any
): Response {
  const response: ApiResponse = {
    success: false,
    message,
    ...(errors !== undefined ? { errors } : {}),
  };
  return res.status(statusCode).json(response);
}
