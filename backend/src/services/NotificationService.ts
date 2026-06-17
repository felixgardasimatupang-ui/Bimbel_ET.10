import { SppStatus, NotificationType, AuditAction, AuditEntity } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { createAuditLog } from '../utils/audit.js';

export class NotificationService {
  async list(userId?: string, role?: string) {
    const where: any = {};
    if (role === 'WALI_MURID' || role === 'SISWA') {
      where.OR = [{ userId }, { targetRole: 'ALL' }, { targetRole: role }];
    }

    return prisma.notification.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 20,
    });
  }

  async sendSppReminders(userId?: string) {
    const students = await prisma.student.findMany({ where: { sppStatus: SppStatus.BELUM_BAYAR, active: true } });
    if (students.length === 0) return { message: 'Semua siswa telah membayar SPP' };

    const notifs = students.map((s) => ({
      userId: null,
      title: `Tagihan SPP: ${s.name}`,
      message: `Pemberitahuan kepada Wali Murid ${s.parentName}, masa tenggang pembayaran SPP Rp ${s.sppAmount.toLocaleString('id-ID')} untuk siswa ${s.name} akan segera berakhir.`,
      type: NotificationType.SPP_INFO,
      targetRole: 'WALI_MURID',
    }));

    await prisma.notification.createMany({ data: notifs });

    await createAuditLog({
      userId,
      action: AuditAction.CREATE,
      entity: AuditEntity.notification,
      details: `SPP reminders sent to ${students.length} parents`,
    });

    return { message: `${students.length} pengingat SPP terkirim` };
  }

  async sendExamReminder(userId?: string) {
    await prisma.notification.create({
      data: {
        title: 'PENGINGAT UJIAN: Evaluasi Tengah Semester',
        message: 'Ujian simulasi UTBK Mandiri dijadwalkan lusa. Mohon seluruh siswa mengunduh lembar latihan di modul belajar kuis interaktif.',
        type: NotificationType.UJIAN_INFO,
        targetRole: 'ALL',
      },
    });

    await createAuditLog({
      userId,
      action: AuditAction.CREATE,
      entity: AuditEntity.notification,
      details: 'Exam reminder broadcast sent to all roles',
    });

    return { message: 'Pengingat ujian terkirim' };
  }
}
