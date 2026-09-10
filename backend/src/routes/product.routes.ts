import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';
import { validateProduct } from '../validators/product.validator.js';

const router = Router();

router.use(authenticateToken);

// GET /api/products/categories (All authenticated roles)
router.get('/categories', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), (req, res, next) =>
  productController.getCategories(req, res, next)
);

// GET /api/products (All authenticated roles)
router.get('/', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), (req, res, next) =>
  productController.getProducts(req, res, next)
);

// GET /api/products/:id (All authenticated roles)
router.get('/:id', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), (req, res, next) =>
  productController.getProductById(req, res, next)
);

// POST /api/products (ADMIN, WAREHOUSE)
router.post('/', authorizeRoles('ADMIN', 'WAREHOUSE'), validateProduct, (req, res, next) =>
  productController.createProduct(req, res, next)
);

// PUT /api/products/:id (ADMIN, WAREHOUSE)
router.put('/:id', authorizeRoles('ADMIN', 'WAREHOUSE'), validateProduct, (req, res, next) =>
  productController.updateProduct(req, res, next)
);

export default router;
