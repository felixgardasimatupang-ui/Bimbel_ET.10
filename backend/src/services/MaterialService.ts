import { AuditAction, AuditEntity, MaterialType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { createAuditLog } from '../utils/audit.js';
import { AppError } from '../utils/AppError.js';

export class MaterialService {
  async list(search?: string, subjectFilter?: string, userRole?: string) {
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

    return prisma.material.findMany({ where: where as any, orderBy: { createdAt: 'desc' } });
  }

  async create(data: { title: string; subject: string; targetLevel: string; type: 'PDF' | 'VIDEO' | 'TUGAS'; isLocked?: boolean }, userId?: string) {
    const author = 'Administrator';

    const material = await prisma.material.create({
      data: { ...data, type: data.type as MaterialType, isLocked: data.isLocked ?? false, author },
    });

    await createAuditLog({ userId, action: AuditAction.CREATE, entity: AuditEntity.material, entityId: material.id });
    return material;
  }

  async incrementDownload(id: string) {
    if (!id || id.length < 8) throw new AppError(400, 'ID materi tidak valid');

    const existing = await prisma.material.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Materi tidak ditemukan');

    return prisma.material.update({
      where: { id },
      data: { downloadsCount: { increment: 1 } },
    });
  }
}
