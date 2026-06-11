import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();
const router = Router();

function parseIntSafe(val: string | undefined, defaultVal: number, min: number, max: number): number {
  const n = parseInt(val || String(defaultVal), 10);
  if (isNaN(n)) return defaultVal;
  return Math.max(min, Math.min(max, n));
}

router.use(authenticate);

router.get('/', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response) => {
  const pageNum = parseIntSafe(req.query.page as string | undefined, 1, 1, Infinity);
  const limitNum = parseIntSafe(req.query.limit as string | undefined, 50, 1, 100);
  const action = req.query.action as string | undefined;
  const entity = req.query.entity as string | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;

  const where: Record<string, unknown> = {};

  if (action && action !== 'Semua') {
    where.action = action;
  }
  if (entity && entity !== 'Semua') {
    where.entity = entity;
  }
  if (startDate) {
    const d = new Date(startDate);
    if (isNaN(d.getTime())) {
      logger.warn({ startDate }, 'Invalid startDate filter');
    } else {
      where.createdAt = { ...(where.createdAt as object || {}), gte: d };
    }
  }
  if (endDate) {
    const d = new Date(endDate);
    if (isNaN(d.getTime())) {
      logger.warn({ endDate }, 'Invalid endDate filter');
    } else {
      d.setHours(23, 59, 59, 999);
      where.createdAt = { ...(where.createdAt as object || {}), lte: d };
    }
  }

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: where as any,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count({ where: where as any }),
  ]);

  res.json({
    success: true,
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

export default router;
