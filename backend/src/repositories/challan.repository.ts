import { query } from '../config/db.js';
import { Challan, ChallanItem, PaginatedResult, PaginationParams } from '../types/index.js';

export class ChallanRepository {
  async findAll(params: PaginationParams): Promise<PaginatedResult<Challan>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.search && params.search.trim()) {
      const searchTerm = `%${params.search.trim()}%`;
      conditions.push(
        `(c.challan_number ILIKE $${paramIndex} OR cust.customer_name ILIKE $${paramIndex} OR cust.business_name ILIKE $${paramIndex})`
      );
      values.push(searchTerm);
      paramIndex++;
    }

    if (params.status && params.status !== 'ALL') {
      conditions.push(`c.status = $${paramIndex}`);
      values.push(params.status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM challans c
      JOIN customers cust ON c.customer_id = cust.id
      ${whereClause}
    `;
    const countRes = await query<{ total: string }>(countSql, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const dataSql = `
      SELECT 
        c.id,
        c.challan_number,
        c.customer_id,
        cust.customer_name,
        cust.business_name,
        cust.mobile as customer_mobile,
        c.total_quantity,
        COALESCE((SELECT SUM(total_price) FROM challan_items WHERE challan_id = c.id), 0) as total_amount,
        c.status,
        c.created_by,
        u.name as created_by_name,
        c.created_at,
        c.updated_at
      FROM challans c
      JOIN customers cust ON c.customer_id = cust.id
      LEFT JOIN users u ON c.created_by = u.id
      ${whereClause}
      ORDER BY c.created_at DESC, c.id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const dataRes = await query<Challan>(dataSql, [...values, limit, offset]);

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

  async findById(id: number): Promise<Challan | null> {
    const dataSql = `
      SELECT 
        c.id,
        c.challan_number,
        c.customer_id,
        cust.customer_name,
        cust.business_name,
        cust.mobile as customer_mobile,
        cust.gst_number,
        cust.address as customer_address,
        c.total_quantity,
        COALESCE((SELECT SUM(total_price) FROM challan_items WHERE challan_id = c.id), 0) as total_amount,
        c.status,
        c.created_by,
        u.name as created_by_name,
        c.created_at,
        c.updated_at
      FROM challans c
      JOIN customers cust ON c.customer_id = cust.id
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = $1
    `;
    const res = await query<Challan>(dataSql, [id]);
    if (res.rows.length === 0) return null;

    const challan = res.rows[0];

    // Fetch associated items
    const itemsRes = await query<ChallanItem>(
      `SELECT * FROM challan_items WHERE challan_id = $1 ORDER BY id ASC`,
      [id]
    );
    challan.items = itemsRes.rows;

    return challan;
  }
}

export const challanRepository = new ChallanRepository();
