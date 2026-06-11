import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from '../types/index.js';
const router = Router();

router.use(authenticate);

router.get('/', async (_req: AuthRequest, res: Response) => {
  const data = await prisma.schedule.findMany({
    orderBy: { startTime: 'asc' },
  });
  res.json({ success: true, data });
});

export default router;
