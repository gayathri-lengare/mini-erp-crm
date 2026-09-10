import { Request, Response, NextFunction } from 'express';
import { customerService } from '../services/customer.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

export class CustomerController {
  async getCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, status, customer_type } = req.query;
      const result = await customerService.getCustomers({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string,
        status: status as string,
        customer_type: customer_type as string,
      });
      sendSuccess(res, 'Customers retrieved successfully.', result);
    } catch (err) {
      next(err);
    }
  }

  async getCustomerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const customer = await customerService.getCustomerById(id);
      sendSuccess(res, 'Customer details retrieved successfully.', customer);
    } catch (err) {
      next(err);
    }
  }

  async createCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await customerService.createCustomer(req.body);
      sendSuccess(res, 'Customer created successfully.', customer, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const customer = await customerService.updateCustomer(id, req.body);
      sendSuccess(res, 'Customer updated successfully.', customer);
    } catch (err) {
      next(err);
    }
  }

  async deleteCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await customerService.deleteCustomer(id);
      sendSuccess(res, 'Customer deleted successfully.');
    } catch (err) {
      next(err);
    }
  }

  async getFollowUps(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const followUps = await customerService.getFollowUps(id);
      sendSuccess(res, 'Customer follow-up history retrieved.', followUps);
    } catch (err) {
      next(err);
    }
  }

  async addFollowUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = parseInt(req.params.id, 10);
      const { note, follow_up_date } = req.body;
      const userId = req.user?.id || null;

      const followUp = await customerService.addFollowUp(
        customerId,
        note,
        follow_up_date || null,
        userId
      );
      sendSuccess(res, 'Follow-up note added successfully.', followUp, 201);
    } catch (err) {
      next(err);
    }
  }
}

export const customerController = new CustomerController();
