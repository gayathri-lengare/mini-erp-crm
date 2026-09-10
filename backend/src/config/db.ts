import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { env } from './env.js';

// Configure connection pool
// Note: In cloud deployments (Neon, Supabase, Render), SSL is required.
const isSslRequired = env.DATABASE_URL.includes('sslmode=require') || env.NODE_ENV === 'production';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isSslRequired ? { rejectUnauthorized: false } : false,
  max: 20, // Max concurrent database clients
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Helper to execute standard queries
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (env.NODE_ENV === 'development' && duration > 500) {
    console.warn(`Slow Query (${duration}ms):`, text);
  }
  return res;
}

// Helper to acquire a client for transactions
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

// Test database connection helper
export async function testConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW() as current_time, current_database() as db_name');
    console.log(`Connected to PostgreSQL: Database "${res.rows[0].db_name}" at ${res.rows[0].current_time}`);
  } finally {
    client.release();
  }
}
