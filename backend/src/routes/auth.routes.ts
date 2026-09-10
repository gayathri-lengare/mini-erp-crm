import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validateLogin } from '../validators/auth.validator.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/auth/login
router.post('/login', validateLogin, (req, res, next) => authController.login(req, res, next));

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res, next) => authController.getMe(req, res, next));

export default router;
