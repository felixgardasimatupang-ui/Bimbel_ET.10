import { Router, Request, Response } from 'express';
import { PrismaClient, AuditAction, AuditEntity } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const prisma = new PrismaClient();
const router = Router();

router.use(authenticate);

router.get('/', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response) => {
  const page = req.query.page as string || '1';
  const limit = req.query.limit as string || '50';
  const action = req.query.action as string | undefined;
  const entity = req.query.entity as string | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

  const where: Record<string, unknown> = {};

  if (action && action !== 'Semua') {
    where.action = action;
  }
  if (entity && entity !== 'Semua') {
    where.entity = entity;
  }
  if (startDate) {
    where.createdAt = { ...(where.createdAt as object || {}), gte: new Date(startDate) };
  }
  if (endDate) {
    where.createdAt = { ...(where.createdAt as object || {}), lte: new Date(endDate) };
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
