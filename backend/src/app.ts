import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

export function createApp(): Application {
  const app = express();

  // Robust CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (curl, mobile apps, postman, same-origin)
        if (!origin) {
          return callback(null, true);
        }

        const cleanOrigin = origin.replace(/\/+$/, '');
        const cleanFrontendUrl = env.FRONTEND_URL ? env.FRONTEND_URL.replace(/\/+$/, '') : '';

        // Allow wildcard or development mode
        if (cleanFrontendUrl === '*' || env.NODE_ENV !== 'production') {
          return callback(null, true);
        }

        // Allow configured frontend URL
        if (cleanOrigin === cleanFrontendUrl) {
          return callback(null, true);
        }

        // Allow all Vercel preview and production deployments
        if (cleanOrigin.endsWith('.vercel.app') || cleanOrigin.includes('vercel.app')) {
          return callback(null, true);
        }

        // Allow local dev origins
        if (['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'].includes(cleanOrigin)) {
          return callback(null, true);
        }

        return callback(null, true); // Permissive fallback for internship portal
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Handle CORS preflight explicitly
  app.options('*', cors());

  // Body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'mini-erp-crm-backend',
    });
  });

  // Root welcome / API status endpoint
  app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'ApexFlow Mini ERP + CRM Backend API is live and operational.',
      service: 'mini-erp-crm-backend',
      version: '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      frontend: env.FRONTEND_URL || 'https://mini-erp-crm-seven-gamma.vercel.app',
      endpoints: {
        health: '/health',
        auth: '/api/auth/login',
        customers: '/api/customers',
        products: '/api/products',
        stockMovements: '/api/stock-movements',
        challans: '/api/challans',
        dashboard: '/api/dashboard/stats',
      },
    });
  });

  // Mount API routes at both /api and root / for resilience against VITE_API_URL format
  app.use('/api', routes);
  app.use('/', routes);

  // 404 Route Not Found
  app.use(notFoundHandler);

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
