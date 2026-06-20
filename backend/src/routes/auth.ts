import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { AuditAction, AuditEntity, UserRole } from '@prisma/client';
import { supabaseAdmin } from '../lib/supabase.js';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { createAuditLog } from '../utils/audit.js';
import { verifyPassword, hashPassword } from '../utils/crypto.js';
import logger from '../utils/logger.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

const JWT_SECRET = process.env.JWT_ACCESS_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_DEFAULT_ROLE: UserRole = (Object.values(UserRole) as string[]).includes(process.env.GOOGLE_DEFAULT_ROLE || '')
  ? (process.env.GOOGLE_DEFAULT_ROLE as UserRole)
  : 'ADMIN';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const REFRESH_COOKIE = 'edu_refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
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

const googleLoginSchema = z.object({
  idToken: z.string().min(1, 'Google ID token wajib diisi'),
});

function signAccessToken(user: { id: string; email: string; role: string; provider?: string | null }) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, provider: user.provider || null },
    JWT_SECRET,
    { expiresIn: '1h' },
  );
}

function signRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

async function storeRefreshToken(userId: string, token: string) {
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

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
    }).catch(() => ({ data: null, error: { message: 'Supabase unreachable' } }));

    let supabaseUid: string | null = null;
    let hashedPassword: string = await hashPassword(password);
    let accessToken = '';
    let refreshToken = '';

    if (supabaseError) {
      logger.warn({ supabaseError: supabaseError.message }, 'Supabase unavailable, registering locally');
    } else if (supabaseData?.user) {
      supabaseUid = supabaseData.user.id;
      hashedPassword = supabaseData.user.user_metadata?.password_hash || hashedPassword;

      const { data: signInData } = await supabaseAdmin.auth.signInWithPassword({
        email, password,
      }).catch(() => ({ data: null, error: null }));
      if (signInData?.session) {
        accessToken = signInData.session.access_token;
        refreshToken = signInData.session.refresh_token;
      }
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
        ...(supabaseUid ? { supabaseUid } : {}),
      },
      select: { id: true, email: true, name: true, role: true, supabaseUid: true },
    });

    if (!accessToken) {
      accessToken = signAccessToken(user);
      const rt = signRefreshToken();
      await storeRefreshToken(user.id, rt);
      refreshToken = rt;
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

    if (!signInError && signInData?.user) {
      const supabaseUid = signInData.user.id;
      const dbUser = await prisma.user.findUnique({ where: { supabaseUid } });

      if (dbUser && dbUser.active) {
        await createAuditLog({ userId: dbUser.id, action: AuditAction.LOGIN, entity: AuditEntity.user, entityId: dbUser.id });

        res.cookie(REFRESH_COOKIE, signInData.session.refresh_token, COOKIE_OPTIONS);
        res.json({
          success: true,
          data: {
            user: { id: dbUser.id, email: dbUser.email, name: dbUser.name, role: dbUser.role },
            accessToken: signInData.session.access_token,
          },
        });
        return;
      }
    }

    const dbUser = await prisma.user.findUnique({ where: { email } });
    if (!dbUser || !dbUser.active || !dbUser.password) {
      res.status(401).json({ success: false, error: 'Email atau password salah' });
      return;
    }

    const valid = await verifyPassword(password, dbUser.password);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Email atau password salah' });
      return;
    }

    const refreshTokenStr = signRefreshToken();
    await storeRefreshToken(dbUser.id, refreshTokenStr);

    await createAuditLog({ userId: dbUser.id, action: AuditAction.LOGIN, entity: AuditEntity.user, entityId: dbUser.id });

    const accessToken = signAccessToken(dbUser);

    res.cookie(REFRESH_COOKIE, refreshTokenStr, COOKIE_OPTIONS);
    res.json({
      success: true,
      data: {
        user: { id: dbUser.id, email: dbUser.email, name: dbUser.name, role: dbUser.role },
        accessToken,
      },
    });
  } catch (err) {
    logger.error(err, 'Login error');
    res.status(500).json({ success: false, error: 'Gagal login' });
  }
});

router.post('/google', validate(googleLoginSchema), async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!googleClient) {
      res.status(500).json({ success: false, error: 'Google Client ID tidak dikonfigurasi' });
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(401).json({ success: false, error: 'Token Google tidak valid' });
      return;
    }

    const googleEmail = payload.email;
    const googleName = payload.name || payload.email.split('@')[0];
    const googlePicture = payload.picture || null;
    const googleSub = payload.sub;

    let user = await prisma.user.findUnique({ where: { email: googleEmail } });

    if (user) {
      if (!user.provider) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            provider: 'google',
            providerId: googleSub,
            avatar: user.avatar || googlePicture,
          },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          email: googleEmail,
          name: googleName,
          role: GOOGLE_DEFAULT_ROLE,
          avatar: googlePicture,
          provider: 'google',
          providerId: googleSub,
          password: null,
        },
      });
    }

    const refreshTokenStr = signRefreshToken();
    await storeRefreshToken(user.id, refreshTokenStr);

    await createAuditLog({ userId: user.id, action: AuditAction.LOGIN, entity: AuditEntity.user, entityId: user.id });

    const accessToken = signAccessToken(user);

    res.cookie(REFRESH_COOKIE, refreshTokenStr, COOKIE_OPTIONS);
    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
        accessToken,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal login dengan Google';
    logger.error({ err }, 'Google login error');
    res.status(401).json({ success: false, error: message });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshTokenCookie = req.cookies?.[REFRESH_COOKIE];
    if (!refreshTokenCookie) {
      res.status(400).json({ success: false, error: 'Refresh token tidak ditemukan' });
      return;
    }

    try {
      const { data: sessionData, error: refreshError } = await supabaseAdmin.auth.refreshSession({
        refresh_token: refreshTokenCookie,
      });

      if (!refreshError && sessionData.session) {
        res.cookie(REFRESH_COOKIE, sessionData.session.refresh_token, COOKIE_OPTIONS);
        res.json({
          success: true,
          data: { accessToken: sessionData.session.access_token },
        });
        return;
      }
    } catch {
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenCookie },
      include: { user: { select: { id: true, email: true, name: true, role: true, provider: true, active: true } } },
    });

    if (!stored || stored.expiresAt < new Date() || !stored.user.active) {
      res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
      res.status(401).json({ success: false, error: 'Refresh token tidak valid atau kadaluarsa' });
      return;
    }

    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const newRefreshTokenStr = signRefreshToken();
    await storeRefreshToken(stored.user.id, newRefreshTokenStr);

    const accessToken = signAccessToken(stored.user);

    res.cookie(REFRESH_COOKIE, newRefreshTokenStr, COOKIE_OPTIONS);
    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (err) {
    logger.error(err, 'Refresh error');
    res.status(401).json({ success: false, error: 'Refresh token tidak valid' });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  const refreshTokenCookie = req.cookies?.[REFRESH_COOKIE];
  if (refreshTokenCookie) {
    try {
      await prisma.refreshToken.deleteMany({ where: { token: refreshTokenCookie } });
    } catch {
    }
  }
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
    select: { id: true, email: true, name: true, role: true, avatar: true, provider: true, createdAt: true, supabaseUid: true },
  });
  if (!full) {
    res.status(404).json({ success: false, error: 'User tidak ditemukan' });
    return;
  }
  res.json({ success: true, data: full });
});

export default router;
