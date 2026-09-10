import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { JWTPayload } from '../types/index.js';

const JWT_EXPIRES_IN = '7d';

/**
 * Signs a JWT token containing user details
 */
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verifies and decodes a JWT token
 */
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
}
