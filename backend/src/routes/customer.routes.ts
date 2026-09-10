import { Router } from 'express';
import { customerController } from '../controllers/customer.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';
import { validateCustomer, validateFollowUp } from '../validators/customer.validator.js';

const router = Router();

// All customer routes require authentication
router.use(authenticateToken);

// GET /api/customers (ADMIN, SALES, ACCOUNTS)
router.get('/', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'), (req, res, next) =>
  customerController.getCustomers(req, res, next)
);

// GET /api/customers/:id (ADMIN, SALES, ACCOUNTS)
router.get('/:id', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'), (req, res, next) =>
  customerController.getCustomerById(req, res, next)
);

// POST /api/customers (ADMIN, SALES)
router.post('/', authorizeRoles('ADMIN', 'SALES'), validateCustomer, (req, res, next) =>
  customerController.createCustomer(req, res, next)
);

// PUT /api/customers/:id (ADMIN, SALES)
router.put('/:id', authorizeRoles('ADMIN', 'SALES'), validateCustomer, (req, res, next) =>
  customerController.updateCustomer(req, res, next)
);

// DELETE /api/customers/:id (ADMIN only)
router.delete('/:id', authorizeRoles('ADMIN'), (req, res, next) =>
  customerController.deleteCustomer(req, res, next)
);

// GET /api/customers/:id/follow-ups (ADMIN, SALES, ACCOUNTS)
router.get('/:id/follow-ups', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'), (req, res, next) =>
  customerController.getFollowUps(req, res, next)
);

// POST /api/customers/:id/follow-ups (ADMIN, SALES)
router.post('/:id/follow-ups', authorizeRoles('ADMIN', 'SALES'), validateFollowUp, (req, res, next) =>
  customerController.addFollowUp(req, res, next)
);

export default router;
