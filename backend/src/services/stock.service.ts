import { stockRepository, StockMovementFilter } from '../repositories/stock.repository.js';
import { getClient } from '../config/db.js';
import { MovementType, PaginatedResult, StockMovement } from '../types/index.js';
import { AppError } from '../middleware/error.middleware.js';

export class StockService {
  async getStockMovements(filter: StockMovementFilter): Promise<PaginatedResult<StockMovement>> {
    return stockRepository.findAll(filter);
  }

  /**
   * Adjust stock manually (e.g. Warehouse intake / restock / damage write-off)
   * Enforces that stock movement and product quantity change happen atomically
   */
  async adjustStock(data: {
    product_id: number;
    quantity: number;
    movement_type: MovementType;
    reason: string;
    created_by: number | null;
  }): Promise<StockMovement> {
    const { product_id, quantity, movement_type, reason, created_by } = data;

    if (quantity <= 0) {
      throw new AppError('Quantity must be greater than zero.', 400);
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Lock product row
      const prodRes = await client.query(
        'SELECT id, product_name, current_stock FROM products WHERE id = $1 FOR UPDATE',
        [product_id]
      );

      if (prodRes.rows.length === 0) {
        throw new AppError(`Product with ID ${product_id} not found.`, 404);
      }

      const product = prodRes.rows[0];

      if (movement_type === 'OUT' && product.current_stock < quantity) {
        throw new AppError(
          `Insufficient stock for product ${product.product_name}. Available: ${product.current_stock}, Requested: ${quantity}`,
          400
        );
      }

      const newStock =
        movement_type === 'IN'
          ? product.current_stock + quantity
          : product.current_stock - quantity;

      await client.query(
        'UPDATE products SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newStock, product_id]
      );

      const moveRes = await client.query<StockMovement>(
        `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [product_id, quantity, movement_type, reason, created_by]
      );

      await client.query('COMMIT');
      return moveRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const stockService = new StockService();
