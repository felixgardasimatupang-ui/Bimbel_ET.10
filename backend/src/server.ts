import app from './app.js';
import { prisma } from './lib/prisma.js';
import { initSentry } from './lib/sentry.js';
import logger from './utils/logger.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const REQUIRED_ENV = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const;

function validateEnv(): void {
  if (process.env.NODE_ENV === 'production') {
    const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
    if (missing.length > 0) {
      throw new Error(`Missing required env vars in production: ${missing.join(', ')}`);
    }
  } else {
    const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
    if (missing.length > 0) {
      logger.warn({ missing }, 'Missing env vars — using dev fallback secrets. Set JWT_ACCESS_SECRET & JWT_REFRESH_SECRET for production.');
      process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-fallback-change-me';
      process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-fallback-change-me';
    }
  }
}

async function main() {
  try {
    validateEnv();
    initSentry();
    await prisma.$connect();
    logger.info('Connected to PostgreSQL');

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`EduAdmin Bimbel API running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}

main();

process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  logger.error(err, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error(reason, 'Unhandled rejection');
});
