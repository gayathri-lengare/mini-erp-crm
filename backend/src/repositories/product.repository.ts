import { query } from '../config/db.js';
import { PaginatedResult, PaginationParams, Product } from '../types/index.js';

export class ProductRepository {
  async findAll(params: PaginationParams): Promise<PaginatedResult<Product>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.search && params.search.trim()) {
      const searchTerm = `%${params.search.trim()}%`;
      conditions.push(
        `(product_name ILIKE $${paramIndex} OR sku ILIKE $${paramIndex} OR category ILIKE $${paramIndex} OR warehouse_location ILIKE $${paramIndex})`
      );
      values.push(searchTerm);
      paramIndex++;
    }

    if (params.category && params.category !== 'ALL') {
      conditions.push(`category = $${paramIndex}`);
      values.push(params.category);
      paramIndex++;
    }

    if (params.low_stock_only) {
      conditions.push(`current_stock <= minimum_stock`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM products ${whereClause}`;
    const countRes = await query<{ total: string }>(countSql, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const dataSql = `
      SELECT *,
        (current_stock <= minimum_stock) as is_low_stock
      FROM products
      ${whereClause}
      ORDER BY (current_stock <= minimum_stock) DESC, id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const dataRes = await query<Product>(dataSql, [...values, limit, offset]);

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

  async findById(id: number): Promise<Product | null> {
    const res = await query<Product>(
      `SELECT *, (current_stock <= minimum_stock) as is_low_stock FROM products WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const res = await query<Product>('SELECT * FROM products WHERE sku = $1', [sku.trim()]);
    return res.rows[0] || null;
  }

  async getCategories(): Promise<string[]> {
    const res = await query<{ category: string }>(
      'SELECT DISTINCT category FROM products ORDER BY category ASC'
    );
    return res.rows.map((r) => r.category);
  }

  async create(data: Partial<Product>): Promise<Product> {
    const res = await query<Product>(
      `INSERT INTO products (
        product_name, sku, category, unit_price,
        current_stock, minimum_stock, warehouse_location
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *, (current_stock <= minimum_stock) as is_low_stock`,
      [
        data.product_name?.trim(),
        data.sku?.trim().toUpperCase(),
        data.category?.trim(),
        data.unit_price,
        data.current_stock ?? 0,
        data.minimum_stock ?? 0,
        data.warehouse_location?.trim() || null,
      ]
    );
    return res.rows[0];
  }

  async update(id: number, data: Partial<Product>): Promise<Product | null> {
    const res = await query<Product>(
      `UPDATE products
       SET product_name = COALESCE($1, product_name),
           sku = COALESCE($2, sku),
           category = COALESCE($3, category),
           unit_price = COALESCE($4, unit_price),
           minimum_stock = COALESCE($5, minimum_stock),
           warehouse_location = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *, (current_stock <= minimum_stock) as is_low_stock`,
      [
        data.product_name?.trim() || null,
        data.sku ? data.sku.trim().toUpperCase() : null,
        data.category?.trim() || null,
        data.unit_price !== undefined ? data.unit_price : null,
        data.minimum_stock !== undefined ? data.minimum_stock : null,
        data.warehouse_location?.trim() || null,
        id,
      ]
    );
    return res.rows[0] || null;
  }
}

export const productRepository = new ProductRepository();
