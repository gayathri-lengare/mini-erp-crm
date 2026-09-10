import { query } from '../config/db.js';
import { MovementType, PaginatedResult, StockMovement } from '../types/index.js';

export interface StockMovementFilter {
  page?: number;
  limit?: number;
  product_id?: number;
  movement_type?: MovementType;
  start_date?: string;
  end_date?: string;
}

export class StockRepository {
  async findAll(filter: StockMovementFilter): Promise<PaginatedResult<StockMovement>> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 15));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filter.product_id) {
      conditions.push(`sm.product_id = $${paramIndex}`);
      values.push(filter.product_id);
      paramIndex++;
    }

    if (filter.movement_type) {
      conditions.push(`sm.movement_type = $${paramIndex}`);
      values.push(filter.movement_type);
      paramIndex++;
    }

    if (filter.start_date) {
      conditions.push(`sm.created_at >= $${paramIndex}`);
      values.push(filter.start_date);
      paramIndex++;
    }

    if (filter.end_date) {
      conditions.push(`sm.created_at <= $${paramIndex}`);
      values.push(filter.end_date);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM stock_movements sm ${whereClause}`;
    const countRes = await query<{ total: string }>(countSql, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const dataSql = `
      SELECT 
        sm.id,
        sm.product_id,
        p.product_name,
        p.sku,
        sm.quantity_changed,
        sm.movement_type,
        sm.reason,
        sm.created_by,
        u.name as created_by_name,
        sm.created_at
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.created_by = u.id
      ${whereClause}
      ORDER BY sm.created_at DESC, sm.id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const dataRes = await query<StockMovement>(dataSql, [...values, limit, offset]);

    return {
      items: dataRes.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async createMovement(data: {
    product_id: number;
    quantity_changed: number;
    movement_type: MovementType;
    reason: string;
    created_by: number | null;
  }): Promise<StockMovement> {
    const res = await query<StockMovement>(
      `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.product_id,
        data.quantity_changed,
        data.movement_type,
        data.reason.trim(),
        data.created_by,
      ]
    );
    return res.rows[0];
  }
}

export const stockRepository = new StockRepository();
