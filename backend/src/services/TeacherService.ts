import { AuditAction, AuditEntity } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { createAuditLog } from '../utils/audit.js';
import { AppError } from '../utils/AppError.js';

export class TeacherService {
  async list() {
    return prisma.teacher.findMany({
      where: { active: true },
      include: { evaluations: { orderBy: { date: 'desc' }, take: 5 } },
      orderBy: { rating: 'desc' },
    });
  }

  async evaluate(id: string, data: { pedagogical: number; professional: number; social: number; feedback: string }, userId?: string) {
    if (!id || id.length < 8) throw new AppError(400, 'ID pengajar tidak valid');

    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (!teacher) throw new AppError(404, 'Pengajar tidak ditemukan');

    const avgScore = (data.pedagogical + data.professional + data.social) / 3;

    await prisma.evaluation.create({
      data: {
        teacherId: id,
        date: new Date().toISOString().split('T')[0],
        reviewer: 'Admin Utama (Sesi Evaluasi Berkala)',
        ...data,
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

    await createAuditLog({ userId, action: AuditAction.EVALUATE, entity: AuditEntity.teacher, entityId: id, details: `Avg score: ${avgScore.toFixed(1)}/5.0` });
    return updated;
  }
}
