import { SppStatus, TransactionType, AttendanceStatus, AttendanceMethod, AuditAction, AuditEntity } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { createAuditLog } from '../utils/audit.js';
import { AppError } from '../utils/AppError.js';
import type { AuthRequest } from '../types/index.js';

function parseIntSafe(val: string | undefined, defaultVal: number, min: number, max: number): number {
  const n = parseInt(val || String(defaultVal), 10);
  if (isNaN(n)) return defaultVal;
  return Math.max(min, Math.min(max, n));
}

export class StudentService {
  async list(req: AuthRequest) {
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

    return {
      data,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    };
  }

  async getById(id: string) {
    if (!id || id.length < 8) throw new AppError(400, 'ID siswa tidak valid');

    const student = await prisma.student.findUnique({
      where: { id },
      include: { subjectsScore: true, progressHistory: true, attendances: { take: 10, orderBy: { date: 'desc' } }, transactions: { take: 10, orderBy: { date: 'desc' } } },
    });
    if (!student) throw new AppError(404, 'Siswa tidak ditemukan');

    return student;
  }

  async create(data: { name: string; classLevel: string; email: string; parentName: string; parentEmail: string; sppAmount: number }, userId?: string) {
    const existing = await prisma.student.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError(409, 'Email siswa sudah terdaftar');

    const student = await prisma.student.create({
      data: {
        ...data,
        qrCodeData: `QR-${data.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString().slice(-4)}`,
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

    await createAuditLog({ userId, action: AuditAction.CREATE, entity: AuditEntity.student, entityId: student.id });
    return student;
  }

  async toggleSpp(id: string, userId?: string) {
    if (!id || id.length < 8) throw new AppError(400, 'ID siswa tidak valid');

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) throw new AppError(404, 'Siswa tidak ditemukan');

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
        await createAuditLog({ userId, action: AuditAction.CREATE, entity: AuditEntity.transaction, entityId: tx.id, details: `Auto-created from SPP toggle: ${student.name}` });
      }
    }

    await createAuditLog({ userId, action: AuditAction.UPDATE, entity: AuditEntity.student, entityId: id, details: `SPP status changed to ${nextStatus}` });
    return updated;
  }

  async checkin(id: string, method: string, userId?: string) {
    if (!id || id.length < 8) throw new AppError(400, 'ID siswa tidak valid');

    const attendanceMethod = ['QR_SCAN', 'LOKASI', 'MANUAL'].includes(method) ? method as AttendanceMethod : AttendanceMethod.QR_SCAN;
    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Siswa tidak ditemukan');

    await prisma.$executeRaw`
      UPDATE students
      SET
        location_checked_in = true,
        check_in_time = ${timeNow},
        performance_score = LEAST(100.0, COALESCE(performance_score, 0.0) + 1.2),
        attendance_rate = LEAST(100.0, COALESCE(attendance_rate, 0.0) + 2.5)
      WHERE id = ${id}
    `;

    const student = await prisma.student.findUnique({
      where: { id },
      include: { subjectsScore: true, progressHistory: true },
    });
    if (!student) throw new AppError(404, 'Siswa tidak ditemukan setelah checkin');

    await prisma.attendance.create({
      data: {
        studentId: id,
        status: AttendanceStatus.HADIR,
        method: attendanceMethod,
        checkInTime: timeNow,
      },
    });

    await createAuditLog({ userId, action: AuditAction.CHECKIN, entity: AuditEntity.student, entityId: id });
    return student;
  }
}
