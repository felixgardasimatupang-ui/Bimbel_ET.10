import app from './app.js';
import { prisma } from './lib/prisma.js';
import { initSentry } from './lib/sentry.js';
import logger from './utils/logger.js';
const PORT = parseInt(process.env.PORT || '3001', 10);

async function main() {
  try {
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
