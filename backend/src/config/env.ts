import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/mini_erp',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_key_not_for_production',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

if (!process.env.JWT_SECRET && env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET environment variable must be set in production');
}

if (!process.env.DATABASE_URL && env.NODE_ENV === 'production') {
  throw new Error('FATAL: DATABASE_URL environment variable must be set in production');
}
