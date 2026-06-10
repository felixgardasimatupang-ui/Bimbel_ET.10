import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

router.use(authenticate);

router.get('/', async (_req: Request, res: Response) => {
  const data = await prisma.schedule.findMany({
    orderBy: { startTime: 'asc' },
  });
  res.json({ success: true, data });
});

export default router;
