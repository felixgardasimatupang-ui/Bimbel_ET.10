import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient, AuditAction, AuditEntity } from '@prisma/client';
import { supabaseAdmin } from '../lib/supabase.js';
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

    const { data: supabaseData, error: supabaseError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (supabaseError) {
      console.error('[REGISTER SUPABASE ERROR]', supabaseError);
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
        role: role || 'ADMIN',
        supabaseUid,
      },
      select: { id: true, email: true, name: true, role: true, supabaseUid: true },
    });

    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    let accessToken = '';
    let refreshToken = '';
    if (sessionData) {
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });
      if (!signInError && signInData.session) {
        accessToken = signInData.session.access_token;
        refreshToken = signInData.session.refresh_token;
      }
    }

    await createAuditLog({ userId: user.id, action: AuditAction.REGISTER, entity: AuditEntity.user, entityId: user.id });

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error('[REGISTER ERROR]', err);
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

    res.json({
      success: true,
      data: {
        user: { id: dbUser.id, email: dbUser.email, name: dbUser.name, role: dbUser.role },
        accessToken: signInData.session.access_token,
        refreshToken: signInData.session.refresh_token,
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

    const { data: sessionData, error: refreshError } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (refreshError || !sessionData.session) {
      res.status(401).json({ success: false, error: 'Refresh token tidak valid atau kadaluarsa' });
      return;
    }

    res.json({
      success: true,
      data: {
        accessToken: sessionData.session.access_token,
        refreshToken: sessionData.session.refresh_token,
      },
    });
  } catch (err) {
    console.error('[REFRESH ERROR]', err);
    res.status(401).json({ success: false, error: 'Refresh token tidak valid' });
  }
});

router.post('/me', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user;
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
