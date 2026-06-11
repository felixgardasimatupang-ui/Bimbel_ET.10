import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient, SppStatus, TransactionType, AttendanceStatus, AttendanceMethod, AuditAction, AuditEntity } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createAuditLog } from '../utils/audit.js';

const prisma = new PrismaClient();
const router = Router();

function parseIntSafe(val: string | undefined, defaultVal: number, min: number, max: number): number {
  const n = parseInt(val || String(defaultVal), 10);
  if (isNaN(n)) return defaultVal;
  return Math.max(min, Math.min(max, n));
}

const createSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  classLevel: z.string().min(1, 'Kelas wajib diisi'),
  email: z.string().email('Email tidak valid'),
  parentName: z.string().optional().default('Tidak Diketahui'),
  parentEmail: z.string().optional().default(''),
  sppAmount: z.number().int().positive('SPP harus lebih dari 0'),
});

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  const search = req.query.search as string | undefined;
  const classFilter = req.query.classFilter as string | undefined;
  const pageNum = parseIntSafe(req.query.page as string | undefined, 1, 1, Infinity);
  const limitNum = parseIntSafe(req.query.limit as string | undefined, 50, 1, 100);
  const where: Record<string, unknown> = { active: true };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { parentName: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (classFilter && classFilter !== 'Semua') {
    where.classLevel = { contains: classFilter, mode: 'insensitive' };
  }
  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where: where as any,
      include: { subjectsScore: true, progressHistory: true },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { name: 'asc' },
    }),
    prisma.student.count({ where: where as any }),
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

router.get('/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id || id.length < 8) {
    res.status(400).json({ success: false, error: 'ID siswa tidak valid' });
    return;
  }
  const student = await prisma.student.findUnique({
    where: { id },
    include: { subjectsScore: true, progressHistory: true, attendances: { take: 10, orderBy: { date: 'desc' } }, transactions: { take: 10, orderBy: { date: 'desc' } } },
  });
  if (!student) {
    res.status(404).json({ success: false, error: 'Siswa tidak ditemukan' });
    return;
  }
  res.json({ success: true, data: student });
});

router.post('/', requireRole('SUPER_ADMIN', 'ADMIN', 'GURU'), validate(createSchema), async (req: Request, res: Response) => {
  const { name, classLevel, email, parentName, parentEmail, sppAmount } = req.body;
  const existing = await prisma.student.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ success: false, error: 'Email siswa sudah terdaftar' });
    return;
  }

  const student = await prisma.student.create({
    data: {
      name, classLevel, email, parentName, parentEmail, sppAmount,
      qrCodeData: `QR-${name.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString().slice(-4)}`,
      subjectsScore: {
        create: [
          { name: 'Matematika', score: 80 },
          { name: 'Fisika', score: 80 },
          { name: 'Kimia', score: 80 },
          { name: 'B. Inggris', score: 80 },
        ],
      },
      progressHistory: {
        create: [
          { month: 'Apr', score: 80, attendance: 100 },
          { month: 'Mei', score: 80, attendance: 100 },
        ],
      },
    },
    include: { subjectsScore: true, progressHistory: true },
  });

  await createAuditLog({ userId: (req as any).user?.userId, action: AuditAction.CREATE, entity: AuditEntity.student, entityId: student.id });

  res.status(201).json({ success: true, data: student });
});

router.put('/:id/toggle-spp', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id || id.length < 8) {
    res.status(400).json({ success: false, error: 'ID siswa tidak valid' });
    return;
  }
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) {
    res.status(404).json({ success: false, error: 'Siswa tidak ditemukan' });
    return;
  }

  const nextStatus = student.sppStatus === SppStatus.LUNAS ? SppStatus.BELUM_BAYAR : SppStatus.LUNAS;
  const updated = await prisma.student.update({
    where: { id },
    data: { sppStatus: nextStatus },
  });

  if (nextStatus === SppStatus.LUNAS) {
    const existingTx = await prisma.transaction.findFirst({
      where: {
        studentId: id,
        type: TransactionType.SPP_MASUK,
        date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    });
    if (!existingTx) {
      const tx = await prisma.transaction.create({
        data: {
          studentId: id,
          amount: student.sppAmount,
          type: TransactionType.SPP_MASUK,
          payeeName: `${student.id} - ${student.name} (Wali ${student.parentName})`,
          notes: 'SPP pembayaran instan via panel admin',
        },
      });
      await createAuditLog({ userId: (req as any).user?.userId, action: AuditAction.CREATE, entity: AuditEntity.transaction, entityId: tx.id, details: `Auto-created from SPP toggle: ${student.name}` });
    }
  }

  await createAuditLog({ userId: (req as any).user?.userId, action: AuditAction.UPDATE, entity: AuditEntity.student, entityId: id, details: `SPP status changed to ${nextStatus}` });

  res.json({ success: true, data: updated });
});

router.put('/:id/checkin', requireRole('SUPER_ADMIN', 'ADMIN', 'GURU'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id || id.length < 8) {
    res.status(400).json({ success: false, error: 'ID siswa tidak valid' });
    return;
  }
  const method = typeof req.body?.method === 'string' && ['QR_SCAN', 'LOKASI', 'MANUAL'].includes(req.body.method) ? req.body.method as AttendanceMethod : AttendanceMethod.QR_SCAN;
  const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Siswa tidak ditemukan' });
    return;
  }

  const student = await prisma.student.update({
    where: { id },
    data: {
      locationCheckedIn: true,
      checkInTime: timeNow,
      performanceScore: { increment: 1.2 },
      attendanceRate: { increment: 2.5 },
    },
  });

  await prisma.attendance.create({
    data: {
      studentId: id,
      status: AttendanceStatus.HADIR,
      method,
      checkInTime: timeNow,
    },
  });

  await createAuditLog({ userId: (req as any).user?.userId, action: AuditAction.CHECKIN, entity: AuditEntity.student, entityId: id });

  res.json({ success: true, data: student });
});

export default router;
