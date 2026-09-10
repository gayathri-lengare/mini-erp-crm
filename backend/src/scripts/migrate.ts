import { pool } from '../config/db.js';

export async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('--- Starting Database Migration ---');
    await client.query('BEGIN');

    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Customers Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(150) NOT NULL,
        mobile VARCHAR(20) NOT NULL,
        email VARCHAR(100),
        business_name VARCHAR(150),
        gst_number VARCHAR(50),
        customer_type VARCHAR(20) NOT NULL CHECK (customer_type IN ('Retail', 'Wholesale', 'Distributor')),
        address TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'Lead' CHECK (status IN ('Lead', 'Active', 'Inactive')),
        follow_up_date DATE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Products Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        product_name VARCHAR(150) NOT NULL,
        sku VARCHAR(50) UNIQUE NOT NULL,
        category VARCHAR(50) NOT NULL,
        unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
        current_stock INT NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
        minimum_stock INT NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
        warehouse_location VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Stock Movements Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        quantity_changed INT NOT NULL,
        movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
        reason VARCHAR(255) NOT NULL,
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Challans Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS challans (
        id SERIAL PRIMARY KEY,
        challan_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
        total_quantity INT NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'CANCELLED')),
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Challan Items Table (Stores snapshot info)
    await client.query(`
      CREATE TABLE IF NOT EXISTS challan_items (
        id SERIAL PRIMARY KEY,
        challan_id INT NOT NULL REFERENCES challans(id) ON DELETE CASCADE,
        product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        product_name_snapshot VARCHAR(150) NOT NULL,
        sku_snapshot VARCHAR(50) NOT NULL,
        unit_price_snapshot NUMERIC(10, 2) NOT NULL,
        quantity INT NOT NULL CHECK (quantity > 0),
        total_price NUMERIC(12, 2) NOT NULL
      );
    `);

    // 7. Follow Ups Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS follow_ups (
        id SERIAL PRIMARY KEY,
        customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        note TEXT NOT NULL,
        follow_up_date DATE,
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
      CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(customer_name);
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(product_name);
      CREATE INDEX IF NOT EXISTS idx_challans_number ON challans(challan_number);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
      CREATE INDEX IF NOT EXISTS idx_challan_items_challan ON challan_items(challan_id);
      CREATE INDEX IF NOT EXISTS idx_follow_ups_customer ON follow_ups(customer_id);
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully! All tables and indexes are ready.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Allow direct execution: `tsx src/scripts/migrate.ts`
if (process.argv[1]?.includes('migrate')) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
