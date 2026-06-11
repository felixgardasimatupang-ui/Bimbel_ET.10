import { Router, Response } from 'express';
import { z } from 'zod';
import { AuditAction, AuditEntity } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';
import { createAuditLog } from '../utils/audit.js';
import type { AuthRequest } from '../types/index.js';
const router = Router();

const createSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  subject: z.string().min(1, 'Subjek wajib diisi'),
  targetLevel: z.string().min(1, 'Tingkat kelas wajib diisi'),
  type: z.enum(['PDF', 'VIDEO', 'TUGAS']),
  isLocked: z.boolean().optional().default(false),
});

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const search = req.query.search as string | undefined;
  const subjectFilter = req.query.subjectFilter as string | undefined;
  const userRole = req.user?.role;
  const where: Record<string, unknown> = { active: true };

  if (userRole === 'SISWA') where.isLocked = false;

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { author: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (subjectFilter && subjectFilter !== 'Semua') {
    where.subject = { equals: subjectFilter, mode: 'insensitive' };
  }

  const data = await prisma.material.findMany({ where: where as any, orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data });
});

router.post('/', requireRole('SUPER_ADMIN', 'ADMIN', 'GURU'), validate(createSchema), async (req: AuthRequest, res: Response) => {
  const { title, subject, targetLevel, type, isLocked } = req.body;
  const author = req.user?.role === 'ADMIN' ? 'Administrator' : 'Pengajar Terverifikasi';

  const material = await prisma.material.create({
    data: { title, subject, targetLevel, type, isLocked, author },
  });

  await createAuditLog({ userId: req.user?.userId, action: AuditAction.CREATE, entity: AuditEntity.material, entityId: material.id });

  res.status(201).json({ success: true, data: material });
});

router.put('/:id/download', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  if (!id || id.length < 8) {
    res.status(400).json({ success: false, error: 'ID materi tidak valid' });
    return;
  }
  const existing = await prisma.material.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Materi tidak ditemukan' });
    return;
  }
  const material = await prisma.material.update({
    where: { id },
    data: { downloadsCount: { increment: 1 } },
  });
  res.json({ success: true, data: material });
});

export default router;
