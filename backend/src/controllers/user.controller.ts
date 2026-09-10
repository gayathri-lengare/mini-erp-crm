import { Request, Response, NextFunction } from 'express';
import { userRepository } from '../repositories/user.repository.js';
import { hashPassword } from '../utils/password.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export class UserController {
  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await userRepository.findAll();
      sendSuccess(res, 'Users retrieved successfully.', users);
    } catch (err) {
      next(err);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password || !role) {
        sendError(res, 'Name, email, password, and role are required.', 400);
        return;
      }

      const validRoles = ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'];
      if (!validRoles.includes(role)) {
        sendError(res, `Invalid role. Must be one of: ${validRoles.join(', ')}`, 400);
        return;
      }

      const existing = await userRepository.findByEmail(email);
      if (existing) {
        sendError(res, `User with email "${email}" already exists.`, 409);
        return;
      }

      const password_hash = await hashPassword(password);
      const user = await userRepository.create({ name, email, password_hash, role });
      sendSuccess(res, 'User created successfully.', user, 201);
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
