import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

export class ProductController {
  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, category, low_stock } = req.query;
      const result = await productService.getProducts({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string,
        category: category as string,
        low_stock_only: low_stock === 'true',
      });
      sendSuccess(res, 'Products retrieved successfully.', result);
    } catch (err) {
      next(err);
    }
  }

  async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const product = await productService.getProductById(id);
      sendSuccess(res, 'Product details retrieved successfully.', product);
    } catch (err) {
      next(err);
    }
  }

  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await productService.getCategories();
      sendSuccess(res, 'Categories retrieved successfully.', categories);
    } catch (err) {
      next(err);
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || null;
      const product = await productService.createProduct(req.body, userId);
      sendSuccess(res, 'Product created successfully.', product, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const product = await productService.updateProduct(id, req.body);
      sendSuccess(res, 'Product updated successfully.', product);
    } catch (err) {
      next(err);
    }
  }
}

export const productController = new ProductController();
