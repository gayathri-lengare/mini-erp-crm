import { Router } from 'express';
import { challanController } from '../controllers/challan.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';
import { validateCreateChallan } from '../validators/challan.validator.js';

const router = Router();

router.use(authenticateToken);

// GET /api/challans (ADMIN, SALES, WAREHOUSE, ACCOUNTS)
router.get('/', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), (req, res, next) =>
  challanController.getChallans(req, res, next)
);

// GET /api/challans/:id (ADMIN, SALES, WAREHOUSE, ACCOUNTS)
router.get('/:id', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), (req, res, next) =>
  challanController.getChallanById(req, res, next)
);

// POST /api/challans (ADMIN, SALES)
router.post('/', authorizeRoles('ADMIN', 'SALES'), validateCreateChallan, (req, res, next) =>
  challanController.createChallan(req, res, next)
);

// PUT /api/challans/:id/confirm (ADMIN, SALES)
router.put('/:id/confirm', authorizeRoles('ADMIN', 'SALES'), (req, res, next) =>
  challanController.confirmChallan(req, res, next)
);

// PUT /api/challans/:id/cancel (ADMIN, SALES)
router.put('/:id/cancel', authorizeRoles('ADMIN', 'SALES'), (req, res, next) =>
  challanController.cancelChallan(req, res, next)
);

export default router;
