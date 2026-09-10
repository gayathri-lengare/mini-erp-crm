import { query } from '../config/db.js';

export interface DashboardStats {
  totalCustomers: number;
  totalProducts: number;
  lowStockProductsCount: number;
  draftChallansCount: number;
  confirmedChallansCount: number;
  recentChallans: any[];
  recentStockMovements: any[];
  lowStockProducts: any[];
}

export class DashboardService {
  async getDashboardData(): Promise<DashboardStats> {
    // 1. Total Customers
    const custRes = await query<{ count: string }>('SELECT COUNT(*) as count FROM customers');
    const totalCustomers = parseInt(custRes.rows[0].count, 10);

    // 2. Total Products
    const prodRes = await query<{ count: string }>('SELECT COUNT(*) as count FROM products');
    const totalProducts = parseInt(prodRes.rows[0].count, 10);

    // 3. Low Stock Products Count
    const lowStockCountRes = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM products WHERE current_stock <= minimum_stock'
    );
    const lowStockProductsCount = parseInt(lowStockCountRes.rows[0].count, 10);

    // 4. Challan Counts (Draft & Confirmed)
    const challanCountsRes = await query<{ status: string; count: string }>(
      'SELECT status, COUNT(*) as count FROM challans GROUP BY status'
    );
    let draftChallansCount = 0;
    let confirmedChallansCount = 0;
    for (const row of challanCountsRes.rows) {
      if (row.status === 'DRAFT') draftChallansCount = parseInt(row.count, 10);
      if (row.status === 'CONFIRMED') confirmedChallansCount = parseInt(row.count, 10);
    }

    // 5. Recent Challans (5 latest)
    const recentChallansRes = await query(`
      SELECT 
        c.id,
        c.challan_number,
        c.customer_id,
        cust.customer_name,
        c.total_quantity,
        COALESCE((SELECT SUM(total_price) FROM challan_items WHERE challan_id = c.id), 0) as total_amount,
        c.status,
        c.created_at
      FROM challans c
      JOIN customers cust ON c.customer_id = cust.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    // 6. Recent Stock Movements (5 latest)
    const recentMovementsRes = await query(`
      SELECT 
        sm.id,
        sm.product_id,
        p.product_name,
        p.sku,
        sm.quantity_changed,
        sm.movement_type,
        sm.reason,
        u.name as created_by_name,
        sm.created_at
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.created_by = u.id
      ORDER BY sm.created_at DESC
      LIMIT 5
    `);

    // 7. Low Stock Products (Top 5 lowest)
    const lowStockListRes = await query(`
      SELECT id, product_name, sku, category, current_stock, minimum_stock, warehouse_location
      FROM products
      WHERE current_stock <= minimum_stock
      ORDER BY (current_stock - minimum_stock) ASC, id ASC
      LIMIT 5
    `);

    return {
      totalCustomers,
      totalProducts,
      lowStockProductsCount,
      draftChallansCount,
      confirmedChallansCount,
      recentChallans: recentChallansRes.rows,
      recentStockMovements: recentMovementsRes.rows,
      lowStockProducts: lowStockListRes.rows,
    };
  }
}

export const dashboardService = new DashboardService();
