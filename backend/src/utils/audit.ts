import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createAuditLog(params: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ip?: string;
}) {
  try {
    await prisma.auditLog.create({ data: params });
  } catch {
    // silently fail — audit should never break the app
  }
}
