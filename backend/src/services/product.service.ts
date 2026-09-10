import { productRepository } from '../repositories/product.repository.js';
import { stockRepository } from '../repositories/stock.repository.js';
import { PaginatedResult, PaginationParams, Product } from '../types/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { getClient } from '../config/db.js';

export class ProductService {
  async getProducts(params: PaginationParams): Promise<PaginatedResult<Product>> {
    return productRepository.findAll(params);
  }

  async getProductById(id: number): Promise<Product> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new AppError(`Product with ID ${id} not found.`, 404);
    }
    return product;
  }

  async getCategories(): Promise<string[]> {
    return productRepository.getCategories();
  }

  async createProduct(data: Partial<Product>, userId: number | null): Promise<Product> {
    // Check if SKU already exists
    if (data.sku) {
      const existing = await productRepository.findBySku(data.sku);
      if (existing) {
        throw new AppError(`A product with SKU "${data.sku.toUpperCase()}" already exists.`, 409);
      }
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const product = await productRepository.create(data);

      // Section 7: "When stock changes, create a corresponding stock movement record. Never change stock without recording the movement."
      if (product.current_stock > 0) {
        await client.query(
          `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
           VALUES ($1, $2, 'IN', $3, $4)`,
          [
            product.id,
            product.current_stock,
            'Initial product stock registration',
            userId,
          ]
        );
      }

      await client.query('COMMIT');
      return product;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new AppError(`Product with ID ${id} not found.`, 404);
    }

    if (data.sku && data.sku.toUpperCase() !== existing.sku) {
      const skuMatch = await productRepository.findBySku(data.sku);
      if (skuMatch && skuMatch.id !== id) {
        throw new AppError(`A product with SKU "${data.sku.toUpperCase()}" already exists.`, 409);
      }
    }

    const updated = await productRepository.update(id, data);
    if (!updated) {
      throw new AppError(`Failed to update product with ID ${id}.`, 400);
    }
    return updated;
  }
}

export const productService = new ProductService();
