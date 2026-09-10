import { query } from '../config/db.js';
import { Customer, FollowUp, PaginatedResult, PaginationParams } from '../types/index.js';

export class CustomerRepository {
  async findAll(params: PaginationParams): Promise<PaginatedResult<Customer>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.search && params.search.trim()) {
      const searchTerm = `%${params.search.trim()}%`;
      conditions.push(
        `(customer_name ILIKE $${paramIndex} OR mobile ILIKE $${paramIndex} OR business_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`
      );
      values.push(searchTerm);
      paramIndex++;
    }

    if (params.status && params.status !== 'ALL') {
      conditions.push(`status = $${paramIndex}`);
      values.push(params.status);
      paramIndex++;
    }

    if (params.customer_type && params.customer_type !== 'ALL') {
      conditions.push(`customer_type = $${paramIndex}`);
      values.push(params.customer_type);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countSql = `SELECT COUNT(*) as total FROM customers ${whereClause}`;
    const countRes = await query<{ total: string }>(countSql, values);
    const total = parseInt(countRes.rows[0].total, 10);

    // Data query
    const dataSql = `
      SELECT *
      FROM customers
      ${whereClause}
      ORDER BY id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const dataRes = await query<Customer>(dataSql, [...values, limit, offset]);

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

  async findById(id: number): Promise<Customer | null> {
    const res = await query<Customer>('SELECT * FROM customers WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async create(data: Partial<Customer>): Promise<Customer> {
    const res = await query<Customer>(
      `INSERT INTO customers (
        customer_name, mobile, email, business_name, gst_number,
        customer_type, address, status, follow_up_date, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        data.customer_name?.trim(),
        data.mobile?.trim(),
        data.email?.trim() || null,
        data.business_name?.trim() || null,
        data.gst_number?.trim() || null,
        data.customer_type || 'Retail',
        data.address?.trim() || null,
        data.status || 'Lead',
        data.follow_up_date || null,
        data.notes?.trim() || null,
      ]
    );
    return res.rows[0];
  }

  async update(id: number, data: Partial<Customer>): Promise<Customer | null> {
    const res = await query<Customer>(
      `UPDATE customers
       SET customer_name = COALESCE($1, customer_name),
           mobile = COALESCE($2, mobile),
           email = $3,
           business_name = $4,
           gst_number = $5,
           customer_type = COALESCE($6, customer_type),
           address = $7,
           status = COALESCE($8, status),
           follow_up_date = $9,
           notes = $10,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        data.customer_name?.trim() || null,
        data.mobile?.trim() || null,
        data.email?.trim() || null,
        data.business_name?.trim() || null,
        data.gst_number?.trim() || null,
        data.customer_type || null,
        data.address?.trim() || null,
        data.status || null,
        data.follow_up_date || null,
        data.notes?.trim() || null,
        id,
      ]
    );
    return res.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const res = await query('DELETE FROM customers WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async getFollowUps(customerId: number): Promise<FollowUp[]> {
    const sql = `
      SELECT f.*, u.name as created_by_name
      FROM follow_ups f
      LEFT JOIN users u ON f.created_by = u.id
      WHERE f.customer_id = $1
      ORDER BY f.created_at DESC
    `;
    const res = await query<FollowUp>(sql, [customerId]);
    return res.rows;
  }

  async addFollowUp(
    customerId: number,
    note: string,
    followUpDate: string | null,
    userId: number | null
  ): Promise<FollowUp> {
    // 1. Insert follow_up record
    const insertRes = await query<FollowUp>(
      `INSERT INTO follow_ups (customer_id, note, follow_up_date, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [customerId, note.trim(), followUpDate || null, userId]
    );

    // 2. Also optionally update customer follow_up_date if provided
    if (followUpDate) {
      await query(
        `UPDATE customers SET follow_up_date = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [followUpDate, customerId]
      );
    }

    return insertRes.rows[0];
  }
}

export const customerRepository = new CustomerRepository();
