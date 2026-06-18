import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '../../routes/auth.js';
import { mockPrisma, mockSupabaseAdmin } from '../setup.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Internal error' });
  });
  return app;
}

describe('Auth Routes (POST /api/auth)', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createApp();
  });

  describe('POST /login', () => {
    it('returns 200 with tokens on valid credentials', async () => {
      mockSupabaseAdmin.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'supabase-uid', email: 'test@test.com' },
          session: {
            access_token: 'access-token-123',
            refresh_token: 'refresh-token-123',
            user: { id: 'supabase-uid' },
          },
        },
        error: null,
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        name: 'Test User',
        role: 'ADMIN',
        active: true,
        supabaseUid: 'supabase-uid',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBe('access-token-123');
      expect(res.body.data.user.email).toBe('test@test.com');
      expect(res.body.data.user.role).toBe('ADMIN');
    });

    it('returns 401 on invalid email/password', async () => {
      mockSupabaseAdmin.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@test.com', password: 'wrongpass' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Email atau password salah');
    });

    it('returns 401 when user is inactive', async () => {
      mockSupabaseAdmin.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'inactive-uid', email: 'inactive@test.com' },
          session: { access_token: 'token', refresh_token: 'refresh', user: { id: 'inactive-uid' } },
        },
        error: null,
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'inactive@test.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Email atau password salah');
    });

    it('returns 400 with validation error for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /register', () => {
    it('returns 201 on successful registration', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      mockSupabaseAdmin.auth.admin.createUser.mockResolvedValue({
        data: {
          user: { id: 'new-supabase-uid', user_metadata: { password_hash: 'hashed' } },
        },
        error: null,
      });

      mockPrisma.user.create.mockResolvedValue({
        id: '1',
        email: 'new@test.com',
        name: 'New User',
        role: 'ADMIN',
        supabaseUid: 'new-supabase-uid',
      });

      mockSupabaseAdmin.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'new-supabase-uid' },
          session: { access_token: 'new-access-token', refresh_token: 'new-refresh-token', user: { id: 'new-supabase-uid' } },
        },
        error: null,
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'new@test.com', password: 'password123', name: 'New User' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('new@test.com');
      expect(res.body.data.accessToken).toBe('new-access-token');
    });

    it('returns 409 when email already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'existing@test.com',
        name: 'Existing',
        role: 'ADMIN',
        supabaseUid: 'uid',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'existing@test.com', password: 'password123', name: 'Existing' });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Email sudah terdaftar');
    });
  });

  describe('POST /logout', () => {
    it('returns 200 and clears cookie', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', ['edu_refresh_token=some-token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 200 without cookie when no refresh token', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /refresh', () => {
    it('returns 400 when no refresh token cookie', async () => {
      const res = await request(app).post('/api/auth/refresh');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Refresh token tidak ditemukan');
    });
  });
});