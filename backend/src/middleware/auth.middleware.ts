import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { sendError } from '../utils/apiResponse.js';
import { UserRole } from '../types/index.js';

/**
 * Authentication Middleware:
 * Inspects Authorization: Bearer <token> header, verifies token validity,
 * and attaches decoded user payload to Express request object (req.user).
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    sendError(res, 'Authentication required. Missing Bearer token in Authorization header.', 401);
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      sendError(res, 'Session token expired. Please log in again.', 401);
      return;
    }
    sendError(res, 'Invalid authentication token.', 401);
  }
}

/**
 * Role Authorization Middleware:
 * Enforces Role-Based Access Control (RBAC).
 * Example: authorizeRoles('ADMIN', 'SALES')
 */
export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required before checking role authorization.', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        `Access forbidden: Role '${req.user.role}' is not authorized to access this resource. Allowed roles: [${allowedRoles.join(', ')}]`,
        403
      );
      return;
    }

    next();
  };
}
