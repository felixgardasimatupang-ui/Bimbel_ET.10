import { AuditAction, AuditEntity, UserRole } from '@prisma/client';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { supabaseAdmin } from '../lib/supabase.js';
import { prisma } from '../lib/prisma.js';
import { createAuditLog } from '../utils/audit.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_ACCESS_SECRET!;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_DEFAULT_ROLE: UserRole = (Object.values(UserRole) as string[]).includes(process.env.GOOGLE_DEFAULT_ROLE || '')
  ? (process.env.GOOGLE_DEFAULT_ROLE as UserRole)
  : 'ADMIN';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

function signAccessToken(user: { id: string; email: string; role: string; provider?: string | null }) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, provider: user.provider || null },
    JWT_SECRET,
    { expiresIn: '1h' },
  );
}

export class AuthService {
  async register(data: { email: string; password: string; name: string }) {
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new AppError(409, 'Email sudah terdaftar');

    const { data: supabaseData, error: supabaseError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

    if (supabaseError) {
      logger.error({ supabaseError }, 'Supabase register error');
      throw new AppError(500, 'Gagal mendaftarkan user di Supabase Auth');
    }

    const supabaseUid = supabaseData.user.id;

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: '',
        name: data.name,
        role: 'ADMIN',
        supabaseUid,
      },
      select: { id: true, email: true, name: true, role: true, supabaseUid: true },
    });

    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    let accessToken = '';
    let refreshToken = '';
    if (!signInError && signInData.session) {
      accessToken = signInData.session.access_token;
      refreshToken = signInData.session.refresh_token;
    }

    await createAuditLog({ userId: user.id, action: AuditAction.REGISTER, entity: AuditEntity.user, entityId: user.id });

    return { user, accessToken, refreshToken };
  }

  async login(data: { email: string; password: string }) {
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (signInError) throw new AppError(401, 'Email atau password salah');

    const supabaseUid = signInData.user.id;
    const dbUser = await prisma.user.findUnique({ where: { supabaseUid } });

    if (!dbUser || !dbUser.active) throw new AppError(401, 'User tidak ditemukan atau tidak aktif');

    await createAuditLog({ userId: dbUser.id, action: AuditAction.LOGIN, entity: AuditEntity.user, entityId: dbUser.id });

    return {
      user: { id: dbUser.id, email: dbUser.email, name: dbUser.name, role: dbUser.role },
      accessToken: signInData.session.access_token,
      refreshToken: signInData.session.refresh_token,
    };
  }

  async googleLogin(data: { idToken: string }) {
    if (!googleClient) throw new AppError(500, 'Google Client ID tidak dikonfigurasi');

    const ticket = await googleClient.verifyIdToken({
      idToken: data.idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) throw new AppError(401, 'Token Google tidak valid');

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

    const accessToken = signAccessToken(user);
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
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
      accessToken,
      refreshToken: refreshTokenStr,
    };
  }

  async refresh(refreshTokenCookie: string) {
    if (!refreshTokenCookie) throw new AppError(400, 'Refresh token tidak ditemukan');

    // Try 1: Supabase refresh (for email/password users)
    try {
      const { data: sessionData, error: refreshError } = await supabaseAdmin.auth.refreshSession({
        refresh_token: refreshTokenCookie,
      });

      if (!refreshError && sessionData.session) {
        return { accessToken: sessionData.session.access_token, refreshToken: sessionData.session.refresh_token };
      }
    } catch {
      // fall through
    }

    // Try 2: Custom refresh token (for Google OAuth users)
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenCookie },
      include: { user: { select: { id: true, email: true, name: true, role: true, provider: true, active: true } } },
    });

    if (!stored || stored.expiresAt < new Date() || !stored.user.active) {
      throw new AppError(401, 'Refresh token tidak valid atau kadaluarsa');
    }

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const newRefreshTokenStr = crypto.randomBytes(40).toString('hex');
    await prisma.refreshToken.create({
      data: {
        token: newRefreshTokenStr,
        userId: stored.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = signAccessToken(stored.user);
    return { accessToken, refreshToken: newRefreshTokenStr };
  }

  async logout(refreshTokenCookie: string) {
    if (refreshTokenCookie) {
      try {
        await prisma.refreshToken.deleteMany({ where: { token: refreshTokenCookie } });
      } catch {
        // silently fail
      }
    }
  }

  async getMe(userId: string) {
    const full = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, avatar: true, provider: true, createdAt: true, supabaseUid: true },
    });
    if (!full) throw new AppError(404, 'User tidak ditemukan');
    return full;
  }
}
