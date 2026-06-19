import app from './app.js';
import { prisma } from './lib/prisma.js';
import { initSentry } from './lib/sentry.js';
import { validateEnv } from './schemas/env.js';
import logger from './utils/logger.js';

async function main() {
  try {
    const env = validateEnv(process.env as Record<string, string>);
    const PORT = env.API_PORT;

    if (env.NODE_ENV !== 'production' && (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET)) {
      const crypto = await import('crypto');
      logger.warn('Missing JWT secrets — generating ephemeral dev secrets.');
      process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || crypto.randomUUID();
      process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomUUID();
    }
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
