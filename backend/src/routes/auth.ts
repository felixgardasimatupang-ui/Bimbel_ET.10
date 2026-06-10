import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { createAuditLog } from '../utils/audit.js';

const prisma = new PrismaClient();
const router = Router();

const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  name: z.string().min(1, 'Nama wajib diisi'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'GURU', 'SISWA', 'WALI_MURID']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      res.status(409).json({ success: false, error: 'Email sudah terdaftar' });
      return;
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, role: role || 'ADMIN' },
      select: { id: true, email: true, name: true, role: true },
    });

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    await createAuditLog({ userId: user.id, action: 'REGISTER', entity: 'user', entityId: user.id });

    res.status(201).json({ success: true, data: { user, accessToken, refreshToken } });
  } catch (err) {
    console.error('[REGISTER ERROR]', err);
    res.status(500).json({ success: false, error: 'Gagal mendaftarkan user' });
  }
});

router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      res.status(401).json({ success: false, error: 'Email atau password salah' });
      return;
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Email atau password salah' });
      return;
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    await createAuditLog({ userId: user.id, action: 'LOGIN', entity: 'user', entityId: user.id });

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    res.status(500).json({ success: false, error: 'Gagal login' });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, error: 'Refresh token wajib diisi' });
      return;
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      res.status(401).json({ success: false, error: 'Refresh token tidak valid atau kadaluarsa' });
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.active) {
      res.status(401).json({ success: false, error: 'User tidak ditemukan' });
      return;
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    await prisma.refreshToken.delete({ where: { id: stored.id } });
    await prisma.refreshToken.create({
      data: { token: newRefreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    res.json({ success: true, data: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
  } catch (err) {
    console.error('[REFRESH ERROR]', err);
    res.status(401).json({ success: false, error: 'Refresh token tidak valid' });
  }
});

router.post('/me', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const full = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { id: true, email: true, name: true, role: true, avatar: true, createdAt: true },
  });
  if (!full) {
    res.status(404).json({ success: false, error: 'User tidak ditemukan' });
    return;
  }
  res.json({ success: true, data: full });
});

export default router;
