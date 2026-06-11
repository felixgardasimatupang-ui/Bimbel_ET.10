import { AuditAction, AuditEntity } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export async function createAuditLog(params: {
  userId?: string;
  action: AuditAction | string;
  entity: AuditEntity | string;
  entityId?: string;
  details?: string;
  ip?: string;
}) {
  try {
    await prisma.auditLog.create({ data: params as any });
  } catch {
    // silently fail — audit should never break the app
  }
}
