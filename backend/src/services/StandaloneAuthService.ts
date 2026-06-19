import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword, verifyPassword } from '../utils/crypto.js';
import { createAuditLog } from '../utils/audit.js';
import { AuditAction, AuditEntity, UserRole } from '@prisma/client';

const getJwtSecret = () => process.env.JWT_ACCESS_SECRET || 'ephemeral-' + crypto.randomUUID();

export class StandaloneAuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password || !user.active) {
      throw new AppError(401, 'Email atau password salah');
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) throw new AppError(401, 'Email atau password salah');

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, provider: 'standalone' },
      getJwtSecret(),
      { expiresIn: '1h' },
    );

    const refreshTokenStr = crypto.randomBytes(40).toString('hex');
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenStr,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await createAuditLog({ userId: user.id, action: AuditAction.LOGIN, entity: AuditEntity.user, entityId: user.id });

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken,
      refreshToken: refreshTokenStr,
    };
  }

  async register(data: { email: string; password: string; name: string }) {
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new AppError(409, 'Email sudah terdaftar');

    const hashed = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashed,
        name: data.name,
        role: 'ADMIN' as UserRole,
        provider: 'standalone',
      },
      select: { id: true, email: true, name: true, role: true, provider: true },
    });

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, provider: 'standalone' },
      getJwtSecret(),
      { expiresIn: '1h' },
    );

    const refreshTokenStr = crypto.randomBytes(40).toString('hex');
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenStr,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await createAuditLog({ userId: user.id, action: AuditAction.REGISTER, entity: AuditEntity.user, entityId: user.id });

    return { user, accessToken, refreshToken: refreshTokenStr };
  }
}
