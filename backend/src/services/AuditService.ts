import { prisma } from '../lib/prisma.js';
import logger from '../utils/logger.js';

function parseIntSafe(val: string | undefined, defaultVal: number, min: number, max: number): number {
  const n = parseInt(val || String(defaultVal), 10);
  if (isNaN(n)) return defaultVal;
  return Math.max(min, Math.min(max, n));
}

export class AuditService {
  async list(params: {
    page?: string;
    limit?: string;
    action?: string;
    entity?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const pageNum = parseIntSafe(params.page, 1, 1, Infinity);
    const limitNum = parseIntSafe(params.limit, 50, 1, 100);
    const where: Record<string, unknown> = {};

    if (params.action && params.action !== 'Semua') {
      where.action = params.action;
    }
    if (params.entity && params.entity !== 'Semua') {
      where.entity = params.entity;
    }
    if (params.startDate) {
      const d = new Date(params.startDate);
      if (isNaN(d.getTime())) {
        logger.warn({ startDate: params.startDate }, 'Invalid startDate filter');
      } else {
        where.createdAt = { ...(where.createdAt as object || {}), gte: d };
      }
    }
    if (params.endDate) {
      const d = new Date(params.endDate);
      if (isNaN(d.getTime())) {
        logger.warn({ endDate: params.endDate }, 'Invalid endDate filter');
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

    return {
      data,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    };
  }
}
