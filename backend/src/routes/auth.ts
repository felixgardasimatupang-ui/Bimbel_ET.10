import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AuditAction, AuditEntity } from '@prisma/client';
import { supabaseAdmin } from '../lib/supabase.js';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { createAuditLog } from '../utils/audit.js';
import logger from '../utils/logger.js';
import type { AuthRequest } from '../types/index.js';
const router = Router();

const REFRESH_COOKIE = 'edu_refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  name: z.string().min(1, 'Nama wajib diisi'),
});

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      res.status(409).json({ success: false, error: 'Email sudah terdaftar' });
      return;
    }

    const { data: supabaseData, error: supabaseError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (supabaseError) {
      logger.error({ supabaseError }, 'Supabase register error');
      res.status(500).json({ success: false, error: 'Gagal mendaftarkan user di Supabase Auth' });
      return;
    }

    const supabaseUid = supabaseData.user.id;
    const hashedPassword = supabaseData.user.user_metadata?.password_hash || '';

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
        supabaseUid,
      },
      select: { id: true, email: true, name: true, role: true, supabaseUid: true },
    });

    let accessToken = '';
    let refreshToken = '';
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });
    if (!signInError && signInData.session) {
      accessToken = signInData.session.access_token;
      refreshToken = signInData.session.refresh_token;
    }

    await createAuditLog({ userId: user.id, action: AuditAction.REGISTER, entity: AuditEntity.user, entityId: user.id });

    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken,
      },
    });
  } catch (err) {
    logger.error(err, 'Register error');
    res.status(500).json({ success: false, error: 'Gagal mendaftarkan user' });
  }
});

router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      res.status(401).json({ success: false, error: 'Email atau password salah' });
      return;
    }

    const supabaseUid = signInData.user.id;
    const dbUser = await prisma.user.findUnique({ where: { supabaseUid } });

    if (!dbUser || !dbUser.active) {
      res.status(401).json({ success: false, error: 'User tidak ditemukan atau tidak aktif' });
      return;
    }

    await createAuditLog({ userId: dbUser.id, action: AuditAction.LOGIN, entity: AuditEntity.user, entityId: dbUser.id });

    res.cookie(REFRESH_COOKIE, signInData.session.refresh_token, COOKIE_OPTIONS);
    res.json({
      success: true,
      data: {
        user: { id: dbUser.id, email: dbUser.email, name: dbUser.name, role: dbUser.role },
        accessToken: signInData.session.access_token,
      },
    });
  } catch (err) {
    logger.error(err, 'Login error');
    res.status(500).json({ success: false, error: 'Gagal login' });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) {
      res.status(400).json({ success: false, error: 'Refresh token tidak ditemukan' });
      return;
    }

    const { data: sessionData, error: refreshError } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (refreshError || !sessionData.session) {
      res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
      res.status(401).json({ success: false, error: 'Refresh token tidak valid atau kadaluarsa' });
      return;
    }

    res.cookie(REFRESH_COOKIE, sessionData.session.refresh_token, COOKIE_OPTIONS);
    res.json({
      success: true,
      data: {
        accessToken: sessionData.session.access_token,
      },
    });
  } catch (err) {
    logger.error(err, 'Refresh error');
    res.status(401).json({ success: false, error: 'Refresh token tidak valid' });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.json({ success: true });
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ success: false, error: 'Unauthenticated' });
    return;
  }
  const full = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { id: true, email: true, name: true, role: true, avatar: true, createdAt: true, supabaseUid: true },
  });
  if (!full) {
    res.status(404).json({ success: false, error: 'User tidak ditemukan' });
    return;
  }
  res.json({ success: true, data: full });
});

export default router;
