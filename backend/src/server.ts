import app from './app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PORT = parseInt(process.env.PORT || '3001', 10);

async function main() {
  try {
    await prisma.$connect();
    console.log('[DB] Connected to PostgreSQL');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[API] EduAdmin Bimbel API running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('[FATAL] Failed to start server:', err);
    process.exit(1);
  }
}

main();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
