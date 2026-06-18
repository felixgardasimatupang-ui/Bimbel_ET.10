import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import type { Server } from 'http';

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  refreshToken: {
    create: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
};

const mockSupabaseAdmin = {
  auth: {
    admin: { createUser: vi.fn() },
    signInWithPassword: vi.fn(),
    refreshSession: vi.fn(),
    getUser: vi.fn(),
  },
};

vi.mock('../lib/prisma.js', () => ({ prisma: mockPrisma }));
vi.mock('../lib/supabase.js', () => ({ supabaseAdmin: mockSupabaseAdmin }));
vi.mock('../lib/sentry.js', () => ({ initSentry: vi.fn() }));
vi.mock('../utils/audit.js', () => ({ createAuditLog: vi.fn() }));

process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

let server: Server | null = null;

async function createTestServer(): Promise<{ server: Server; baseUrl: string }> {
  const app = (await import('../app.js')).default;
  const http = await import('http');
  const getPort = (await import('get-port')).default;
  const port = await getPort();
  const s = http.createServer(app).listen(port);
  return { server: s, baseUrl: `http://localhost:${port}` };
}

describe('Auth API — Local (Email/Password)', () => {
  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = null;
    }
    vi.clearAllMocks();
  });

  beforeEach(() => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
  });

  describe('POST /api/auth/register', () => {
    const validPayload = { email: 'new@test.com', password: 'password123', name: 'New User' };

    beforeEach(() => {
      mockSupabaseAdmin.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'supabase-uid-1', user_metadata: { password_hash: 'hashed' } } },
        error: null,
      });
      mockSupabaseAdmin.auth.signInWithPassword.mockResolvedValue({
        data: { session: { access_token: 'supabase-at', refresh_token: 'supabase-rt' } },
        error: null,
      });
    });

    it('creates a new user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1', email: 'new@test.com', name: 'New User', role: 'ADMIN', supabaseUid: 'supabase-uid-1',
      });

      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      });
      expect(res.status).toBe(201);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe('new@test.com');
    });

    it('returns 409 when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'new@test.com' });

      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      });
      expect(res.status).toBe(409);
    });

    it('returns 400 for invalid email', async () => {
      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'invalid', password: '123456', name: 'Test' }),
      });
      expect(res.status).toBe(400);
    });

    it('returns 400 for short password', async () => {
      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: '12345', name: 'Test' }),
      });
      expect(res.status).toBe(400);
    });

    it('returns 400 for empty name', async () => {
      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: '123456', name: '' }),
      });
      expect(res.status).toBe(400);
    });

    it('handles Supabase registration failure', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockSupabaseAdmin.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Supabase error' },
      });

      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      });
      expect(res.status).toBe(201);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      mockSupabaseAdmin.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'supabase-uid' },
          session: { access_token: 'supabase-at', refresh_token: 'supabase-rt' },
        },
        error: null,
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN', active: true, supabaseUid: 'supabase-uid',
      });

      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' }),
      });
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe('admin@test.com');
      expect(body.data.accessToken).toBe('supabase-at');
    });

    it('returns 401 for wrong password', async () => {
      mockSupabaseAdmin.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.com', password: 'wrong' }),
      });
      expect(res.status).toBe(401);
    });

    it('returns 401 for inactive user', async () => {
      mockSupabaseAdmin.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'supabase-uid' },
          session: { access_token: 'at', refresh_token: 'rt' },
        },
        error: null,
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', email: 'inactive@test.com', name: 'Inactive', role: 'ADMIN', active: false,
      });

      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'inactive@test.com', password: 'pass123' }),
      });
      expect(res.status).toBe(401);
    });

    it('returns 400 for missing password', async () => {
      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: '' }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('refreshes via Supabase session', async () => {
      mockSupabaseAdmin.auth.refreshSession.mockResolvedValue({
        data: { session: { access_token: 'new-at', refresh_token: 'new-rt' } },
        error: null,
      });

      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { Cookie: 'edu_refresh_token=supabase-rt' },
      });
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.data.accessToken).toBe('new-at');
    });

    it('falls back to custom refresh token when Supabase fails', async () => {
      mockSupabaseAdmin.auth.refreshSession.mockRejectedValue(new Error('Supabase down'));
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1', token: 'custom-rt', expiresAt: new Date(Date.now() + 86400000),
        user: { id: 'user-1', email: 'user@test.com', name: 'User', role: 'ADMIN', provider: 'google', active: true },
      });
      mockPrisma.refreshToken.delete.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { Cookie: 'edu_refresh_token=custom-rt' },
      });
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.data.accessToken).toBeTruthy();
      expect(body.data.accessToken.split('.')).toHaveLength(3);
    });

    it('returns 400 when no refresh cookie', async () => {
      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/auth/refresh`, { method: 'POST' });
      expect(res.status).toBe(400);
    });

    it('returns 401 for expired custom token', async () => {
      mockSupabaseAdmin.auth.refreshSession.mockRejectedValue(new Error('Supabase down'));
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-expired', token: 'expired-rt',
        expiresAt: new Date(Date.now() - 86400000),
        user: { id: 'user-1', email: 'u@test.com', name: 'U', role: 'ADMIN', active: true },
      });

      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { Cookie: 'edu_refresh_token=expired-rt' },
      });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears refresh token and cookie', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { Cookie: 'edu_refresh_token=test-rt' },
      });
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalled();
    });

    it('succeeds even without refresh cookie', async () => {
      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/auth/logout`, { method: 'POST' });
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns current user info', async () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ userId: 'user-1', email: 'admin@test.com', role: 'ADMIN' }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '1h' });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN', active: true,
        avatar: null, provider: null, createdAt: new Date().toISOString(), supabaseUid: null,
      });

      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.data.email).toBe('admin@test.com');
    });

    it('returns 401 without token', async () => {
      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/auth/me`);
      expect(res.status).toBe(401);
    });
  });
});
