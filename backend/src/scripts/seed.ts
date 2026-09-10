import { pool } from '../config/db.js';
import { hashPassword } from '../utils/password.js';

export async function runSeed() {
  const client = await pool.connect();
  try {
    console.log('--- Starting Database Seeding ---');
    await client.query('BEGIN');

    // Clean existing data in reverse dependency order
    await client.query('TRUNCATE TABLE follow_ups, challan_items, challans, stock_movements, products, customers, users RESTART IDENTITY CASCADE');

    const defaultPasswordHash = await hashPassword('password123');

    // 1. Seed Demo Users
    const userInsertQuery = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES 
        ('Admin User', 'admin@example.com', $1, 'ADMIN'),
        ('Sales Representative', 'sales@example.com', $1, 'SALES'),
        ('Warehouse Manager', 'warehouse@example.com', $1, 'WAREHOUSE'),
        ('Accounts Officer', 'accounts@example.com', $1, 'ACCOUNTS')
      RETURNING id, role, email;
    `;
    const userRes = await client.query(userInsertQuery, [defaultPasswordHash]);
    const usersMap = userRes.rows.reduce((acc, u) => {
      acc[u.role] = u.id;
      return acc;
    }, {} as Record<string, number>);

    console.log('Seeded users:', userRes.rows.map(r => `${r.role} (${r.email})`).join(', '));

    // 2. Seed 5 Customers
    const customerInsertQuery = `
      INSERT INTO customers (customer_name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes)
      VALUES
        ('Rajesh Sharma', '9820011223', 'rajesh@apexstores.in', 'Apex Retail Hub', '27AABCA1234F1Z5', 'Retail', 'Shop 4, Commercial Plaza, Mumbai, Maharashtra', 'Active', CURRENT_DATE + INTERVAL '7 days', 'Interested in bulk orders for quarterly festival sale.'),
        ('Amit Patel', '9845033445', 'amit@gujaratdistributors.com', 'Gujarat Distro Corp', '24AACCG5678H1Z2', 'Distributor', 'Plot 12, GIDC Estate, Ahmedabad, Gujarat', 'Active', CURRENT_DATE + INTERVAL '3 days', 'Requested wholesale pricing tier schedule.'),
        ('Pooja Nair', '9876543210', 'pooja@nairwholesalers.com', 'Nair Wholesale Mart', '32AAECN9012K1Z9', 'Wholesale', '88 MG Road, Kochi, Kerala', 'Lead', CURRENT_DATE + INTERVAL '2 days', 'New enquiry via business directory.'),
        ('Sanjay Verma', '9123456780', 'sanjay@delhicentral.org', 'Delhi Central Logistics', '07AACCD3456L1Z4', 'Distributor', 'Warehouse 3, Okhla Phase 2, New Delhi', 'Active', CURRENT_DATE + INTERVAL '10 days', 'Consistent monthly order partner.'),
        ('Vikas Gupta', '9988776655', 'vikas@guptatraders.in', 'Gupta General Traders', '09AAECG7890M1Z8', 'Retail', 'Station Road, Lucknow, Uttar Pradesh', 'Inactive', CURRENT_DATE - INTERVAL '15 days', 'Account dormant since last quarter.')
      RETURNING id, customer_name;
    `;
    const custRes = await client.query(customerInsertQuery);
    console.log(`Seeded ${custRes.rows.length} customers.`);

    // 3. Seed 10 Wholesale / Distribution Products
    const productInsertQuery = `
      INSERT INTO products (product_name, sku, category, unit_price, current_stock, minimum_stock, warehouse_location)
      VALUES
        ('Industrial Barcode Scanner 2D', 'SCAN-2D-001', 'Electronics', 3500.00, 45, 10, 'Bay A-101'),
        ('Heavy Duty Thermal Receipt Printer', 'PRN-TH-502', 'Electronics', 4200.00, 28, 5, 'Bay A-102'),
        ('Ergonomic Mesh Office Chair', 'FUR-CHR-101', 'Furniture', 5800.00, 18, 5, 'Bay B-201'),
        ('Adjustable Steel Laptop Stand', 'ACC-LST-003', 'Accessories', 1250.00, 80, 15, 'Bay B-202'),
        ('Cat6 Ethernet Cable Roll 305m', 'CAB-CAT6-305', 'Networking', 4900.00, 12, 10, 'Bay C-301'),
        ('Gigabit 16-Port Network Switch', 'NET-SW-16G', 'Networking', 6500.00, 8, 10, 'Bay C-302'), -- LOW STOCK (8 <= 10)
        ('Packing Tape Transparent 50m (Pack of 6)', 'PKG-TAP-50M', 'Packaging', 450.00, 150, 30, 'Bay D-401'),
        ('Corrugated Shipping Box 12x10x8 (Bundle 25)', 'PKG-BOX-1210', 'Packaging', 850.00, 4, 10, 'Bay D-402'), -- LOW STOCK (4 <= 10)
        ('Wireless Optical Mouse Multi-Pack (10 Pcs)', 'ACC-MOU-10PK', 'Accessories', 2800.00, 22, 5, 'Bay B-203'),
        ('USB-C Dual HDMI Multiport Dock', 'ACC-DOC-4K', 'Accessories', 3900.00, 3, 5, 'Bay B-204') -- LOW STOCK (3 <= 5)
      RETURNING id, product_name, current_stock, sku;
    `;
    const prodRes = await client.query(productInsertQuery);
    console.log(`Seeded ${prodRes.rows.length} products.`);

    // 4. Seed Initial Stock Movements (Initial Purchase IN)
    for (const prod of prodRes.rows) {
      await client.query(`
        INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
        VALUES ($1, $2, 'IN', 'Initial warehouse intake / vendor purchase', $3)
      `, [prod.id, prod.current_stock, usersMap['WAREHOUSE'] || usersMap['ADMIN']]);
    }
    console.log('Seeded initial stock movements for all products.');

    // 5. Seed Follow-ups for customers
    await client.query(`
      INSERT INTO follow_ups (customer_id, note, follow_up_date, created_by)
      VALUES
        ($1, 'Initial introductory call completed. Customer requested formal quotation for scanners.', CURRENT_DATE + INTERVAL '7 days', $3),
        ($2, 'Follow-up regarding distributor pricing tier. Waiting for GST certificate verification.', CURRENT_DATE + INTERVAL '3 days', $3)
    `, [custRes.rows[0].id, custRes.rows[1].id, usersMap['SALES']]);
    console.log('Seeded customer follow-up records.');

    // 6. Seed Sample Challans (One CONFIRMED, One DRAFT)
    const confirmedChallanNum = 'CH-2026-0001';
    const draftChallanNum = 'CH-2026-0002';

    // Seed Draft Challan
    const draftChallanRes = await client.query(`
      INSERT INTO challans (challan_number, customer_id, total_quantity, status, created_by)
      VALUES ($1, $2, 3, 'DRAFT', $3)
      RETURNING id
    `, [draftChallanNum, custRes.rows[0].id, usersMap['SALES']]);
    const draftChallanId = draftChallanRes.rows[0].id;

    // Items for Draft
    await client.query(`
      INSERT INTO challan_items (challan_id, product_id, product_name_snapshot, sku_snapshot, unit_price_snapshot, quantity, total_price)
      VALUES
        ($1, $2, 'Industrial Barcode Scanner 2D', 'SCAN-2D-001', 3500.00, 2, 7000.00),
        ($1, $3, 'Adjustable Steel Laptop Stand', 'ACC-LST-003', 1250.00, 1, 1250.00)
    `, [draftChallanId, prodRes.rows[0].id, prodRes.rows[3].id]);

    // Seed Confirmed Challan
    const confChallanRes = await client.query(`
      INSERT INTO challans (challan_number, customer_id, total_quantity, status, created_by)
      VALUES ($1, $2, 5, 'CONFIRMED', $3)
      RETURNING id
    `, [confirmedChallanNum, custRes.rows[1].id, usersMap['SALES']]);
    const confChallanId = confChallanRes.rows[0].id;

    // Items for Confirmed
    await client.query(`
      INSERT INTO challan_items (challan_id, product_id, product_name_snapshot, sku_snapshot, unit_price_snapshot, quantity, total_price)
      VALUES
        ($1, $2, 'Industrial Barcode Scanner 2D', 'SCAN-2D-001', 3500.00, 5, 17500.00)
    `, [confChallanId, prodRes.rows[0].id]);

    // Record the corresponding OUT stock movement for confirmed challan
    await client.query(`
      INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
      VALUES ($1, 5, 'OUT', 'Challan Confirmed: ' || $2, $3)
    `, [prodRes.rows[0].id, confirmedChallanNum, usersMap['SALES']]);

    console.log('Seeded sample DRAFT and CONFIRMED challans.');

    await client.query('COMMIT');
    console.log('--- Seeding Completed Successfully! ---');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (process.argv[1]?.includes('seed')) {
  runSeed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
