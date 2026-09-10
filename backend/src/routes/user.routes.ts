import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Only ADMIN can view and create portal users
router.use(authenticateToken, authorizeRoles('ADMIN'));

// GET /api/users
router.get('/', (req, res, next) => userController.getUsers(req, res, next));

// POST /api/users
router.post('/', (req, res, next) => userController.createUser(req, res, next));

export default router;
