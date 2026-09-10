import { userRepository } from '../repositories/user.repository.js';
import { comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { AppError } from '../middleware/error.middleware.js';
import { SafeUser } from '../types/index.js';

export class AuthService {
  async login(email: string, password: string): Promise<{ token: string; user: SafeUser }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = signToken(tokenPayload);

    const safeUser: SafeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return { token, user: safeUser };
  }

  async getProfile(userId: number): Promise<SafeUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User profile not found.', 404);
    }
    return user;
  }
}

export const authService = new AuthService();
