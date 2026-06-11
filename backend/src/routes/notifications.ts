import { Router, Response } from 'express';
import { SppStatus, NotificationType, AuditAction, AuditEntity } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { prisma } from '../lib/prisma.js';
import { createAuditLog } from '../utils/audit.js';
import type { AuthRequest } from '../types/index.js';
const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const role = req.user?.role;

  const where: any = {};
  if (role === 'WALI_MURID' || role === 'SISWA') {
    where.OR = [{ userId }, { targetRole: 'ALL' }, { targetRole: role }];
  }

  const data = await prisma.notification.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: 20,
  });
  res.json({ success: true, data });
});

router.post('/spp-reminder', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const students = await prisma.student.findMany({ where: { sppStatus: SppStatus.BELUM_BAYAR, active: true } });
  if (students.length === 0) {
    res.json({ success: true, message: 'Semua siswa telah membayar SPP' });
    return;
  }

  const notifs = students.map((s) => ({
    userId: null,
    title: `Tagihan SPP: ${s.name}`,
    message: `Pemberitahuan kepada Wali Murid ${s.parentName}, masa tenggang pembayaran SPP Rp ${s.sppAmount.toLocaleString('id-ID')} untuk siswa ${s.name} akan segera berakhir.`,
    type: NotificationType.SPP_INFO,
    targetRole: 'WALI_MURID',
  }));

  await prisma.notification.createMany({ data: notifs });

  await createAuditLog({
    userId: req.user?.userId,
    action: AuditAction.CREATE,
    entity: AuditEntity.notification,
    details: `SPP reminders sent to ${students.length} parents`,
  });

  res.json({ success: true, message: `${students.length} pengingat SPP terkirim` });
});

router.post('/exam-reminder', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  await prisma.notification.create({
    data: {
      title: 'PENGINGAT UJIAN: Evaluasi Tengah Semester',
      message: 'Ujian simulasi UTBK Mandiri dijadwalkan lusa. Mohon seluruh siswa mengunduh lembar latihan di modul belajar kuis interaktif.',
      type: NotificationType.UJIAN_INFO,
      targetRole: 'ALL',
    },
  });

  await createAuditLog({
    userId: req.user?.userId,
    action: AuditAction.CREATE,
    entity: AuditEntity.notification,
    details: 'Exam reminder broadcast sent to all roles',
  });

  res.json({ success: true, message: 'Pengingat ujian terkirim' });
});

export default router;
