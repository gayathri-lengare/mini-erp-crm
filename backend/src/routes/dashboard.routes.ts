import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// All authenticated roles can view high-level dashboard stats
router.use(authenticateToken);

// GET /api/dashboard/stats
router.get('/stats', (req, res, next) => dashboardController.getStats(req, res, next));

export default router;
