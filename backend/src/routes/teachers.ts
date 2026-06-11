import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient, AuditAction, AuditEntity } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createAuditLog } from '../utils/audit.js';

const prisma = new PrismaClient();
const router = Router();

const evaluateSchema = z.object({
  pedagogical: z.number().int().min(1).max(5),
  professional: z.number().int().min(1).max(5),
  social: z.number().int().min(1).max(5),
  feedback: z.string().min(1, 'Catatan evaluasi wajib diisi'),
});

router.use(authenticate);

router.get('/', async (_req: Request, res: Response) => {
  const data = await prisma.teacher.findMany({
    where: { active: true },
    include: { evaluations: { orderBy: { date: 'desc' }, take: 5 } },
    orderBy: { rating: 'desc' },
  });
  res.json({ success: true, data });
});

router.post('/evaluate/:id', requireRole('SUPER_ADMIN', 'ADMIN'), validate(evaluateSchema), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) {
    res.status(404).json({ success: false, error: 'Pengajar tidak ditemukan' });
    return;
  }

  const { pedagogical, professional, social, feedback } = req.body;
  const avgScore = (pedagogical + professional + social) / 3;

  await prisma.evaluation.create({
    data: {
      teacherId: id,
      date: new Date().toISOString().split('T')[0],
      reviewer: 'Admin Utama (Sesi Evaluasi Berkala)',
      pedagogical, professional, social, feedback,
    },
  });

  const allEvals = await prisma.evaluation.findMany({ where: { teacherId: id } });
  const overallRating = allEvals.reduce((acc, e) => acc + (e.pedagogical + e.professional + e.social) / 3, 0) / allEvals.length;
  const roundedRating = Math.round(overallRating * 10) / 10;

  const updated = await prisma.teacher.update({
    where: { id },
    data: {
      rating: roundedRating,
      evaluationScore: Math.min(100, Math.round((roundedRating / 5) * 100)),
    },
    include: { evaluations: { orderBy: { date: 'desc' }, take: 5 } },
  });

  await createAuditLog({ userId: (req as any).user?.userId, action: AuditAction.EVALUATE, entity: AuditEntity.teacher, entityId: id, details: `Avg score: ${avgScore.toFixed(1)}/5.0` });

  res.json({ success: true, data: updated });
});

export default router;
