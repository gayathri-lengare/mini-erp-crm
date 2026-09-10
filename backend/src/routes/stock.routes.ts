import { Router } from 'express';
import { stockController } from '../controllers/stock.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

// GET /api/stock-movements (ADMIN, WAREHOUSE)
router.get('/', authorizeRoles('ADMIN', 'WAREHOUSE'), (req, res, next) =>
  stockController.getStockMovements(req, res, next)
);

// POST /api/stock-movements/adjust (ADMIN, WAREHOUSE)
router.post('/adjust', authorizeRoles('ADMIN', 'WAREHOUSE'), (req, res, next) =>
  stockController.adjustStock(req, res, next)
);

export default router;
