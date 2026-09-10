import { createApp } from './app.js';
import { env } from './config/env.js';
import { testConnection } from './config/db.js';

async function bootstrap() {
  try {
    // 1. Verify Database connectivity
    await testConnection();

    // 2. Initialize Express app
    const app = createApp();

    // 3. Start listening
    const server = app.listen(env.PORT, () => {
      console.log(`=======================================================`);
      console.log(` Mini ERP + CRM Backend Service is running`);
      console.log(` URL: http://localhost:${env.PORT}`);
      console.log(` Environment: ${env.NODE_ENV}`);
      console.log(` Health: http://localhost:${env.PORT}/health`);
      console.log(`=======================================================`);
    });

    // Graceful shutdown handling
    const shutdown = () => {
      console.log('Received shutdown signal. Closing server...');
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
