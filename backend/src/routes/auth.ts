import { Router, Request, Response } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { registerSchema, loginSchema, googleLoginSchema } from '../schemas/auth.js';
import { AuthService } from '../services/index.js';
import logger from '../utils/logger.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();
const authService = new AuthService();

const REFRESH_COOKIE = 'edu_refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body);
    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
    res.status(201).json({
      success: true,
      data: { user: result.user, accessToken: result.accessToken },
    });
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ success: false, error: err.message });
    } else {
      logger.error(err, 'Register error');
      res.status(500).json({ success: false, error: 'Gagal mendaftarkan user' });
    }
  }
});

router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);
    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
    res.json({
      success: true,
      data: { user: result.user, accessToken: result.accessToken },
    });
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ success: false, error: err.message });
    } else {
      logger.error(err, 'Login error');
      res.status(500).json({ success: false, error: 'Gagal login' });
    }
  }
});

router.post('/google', validate(googleLoginSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.googleLogin(req.body);
    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
    res.json({
      success: true,
      data: { user: result.user, accessToken: result.accessToken },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal login dengan Google';
    logger.error({ err }, 'Google login error');
    res.status(err instanceof Object && 'statusCode' in (err as any) ? (err as any).statusCode : 401).json({ success: false, error: message });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshTokenCookie = req.cookies?.[REFRESH_COOKIE];
    const result = await authService.refresh(refreshTokenCookie || '');
    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
    res.json({ success: true, data: { accessToken: result.accessToken } });
  } catch (err: any) {
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    const statusCode = err.statusCode || 401;
    if (statusCode >= 500) logger.error(err, 'Refresh error');
    res.status(statusCode).json({ success: false, error: err.message || 'Refresh token tidak valid' });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  const refreshTokenCookie = req.cookies?.[REFRESH_COOKIE];
  await authService.logout(refreshTokenCookie || '');
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.json({ success: true });
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) { res.status(401).json({ success: false, error: 'Unauthenticated' }); return; }
    const full = await authService.getMe(user.userId);
    res.json({ success: true, data: full });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

export default router;
