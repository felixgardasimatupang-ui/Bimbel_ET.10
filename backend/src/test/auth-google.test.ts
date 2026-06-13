import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Server } from 'http';

// ─── Mocks ─────────────────────────────────────────────
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  refreshToken: {
    create: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  $queryRaw: vi.fn(),
};
const mockSupabaseAdmin = { auth: { getUser: vi.fn() } };

const { mockGoogleClient } = vi.hoisted(() => ({
  mockGoogleClient: { verifyIdToken: vi.fn() },
}));

vi.mock('../lib/prisma.js', () => ({ prisma: mockPrisma }));
vi.mock('../lib/supabase.js', () => ({ supabaseAdmin: mockSupabaseAdmin }));
vi.mock('../lib/sentry.js', () => ({ initSentry: vi.fn() }));

// We need to mock google-auth-library at module level
vi.mock('google-auth-library', () => {
  const MockOAuth2Client = function () {
    return mockGoogleClient;
  };
  return { OAuth2Client: MockOAuth2Client };
});

process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
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

describe('POST /api/auth/google', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = null;
    }
  });

  it('returns 400 when idToken is missing', async () => {
    const s = await createTestServer();
    server = s.server;

    const res = await fetch(`${s.baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.success).toBe(false);
  });

  it('returns 401 when Google token verification fails', async () => {
    mockGoogleClient.verifyIdToken.mockRejectedValue(new Error('Invalid token'));
    const s = await createTestServer();
    server = s.server;

    const res = await fetch(`${s.baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'invalid-token' }),
    });
    expect(res.status).toBe(401);
    const body: any = await res.json();
    expect(body.success).toBe(false);
  });

  it('returns 401 when token payload has no email', async () => {
    mockGoogleClient.verifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: '123', name: 'No Email' }),
    });
    const s = await createTestServer();
    server = s.server;

    const res = await fetch(`${s.baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'token-no-email' }),
    });
    expect(res.status).toBe(401);
  });

  it('creates new user when email does not exist (upsert — create)', async () => {
    const googlePayload = {
      email: 'new@google.com',
      name: 'New Google User',
      picture: 'https://pic.url/avatar.jpg',
      sub: 'google-sub-123',
    };

    mockGoogleClient.verifyIdToken.mockResolvedValue({
      getPayload: () => googlePayload,
    });
    // Email not found
    mockPrisma.user.findUnique.mockResolvedValue(null);
    // Create succeeds
    mockPrisma.user.create.mockResolvedValue({
      id: 'new-user-id',
      email: 'new@google.com',
      name: 'New Google User',
      role: 'ADMIN',
      avatar: 'https://pic.url/avatar.jpg',
      provider: 'google',
      providerId: 'google-sub-123',
      password: null,
    });
    mockPrisma.refreshToken.create.mockResolvedValue({});

    const s = await createTestServer();
    server = s.server;

    const res = await fetch(`${s.baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'valid-token-new' }),
    });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe('new@google.com');
    expect(body.data.user.name).toBe('New Google User');
    expect(body.data.user.role).toBe('ADMIN');
    expect(body.data.accessToken).toBeTruthy();

    // Verify create was called with correct data
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'new@google.com',
          name: 'New Google User',
          provider: 'google',
          providerId: 'google-sub-123',
          password: null,
        }),
      }),
    );
  });

  it('logs in existing user when email already exists (upsert — login)', async () => {
    const googlePayload = {
      email: 'existing@google.com',
      name: 'Existing User',
      picture: null,
      sub: 'google-sub-456',
    };

    mockGoogleClient.verifyIdToken.mockResolvedValue({
      getPayload: () => googlePayload,
    });
    // Email found — user exists (already has provider='google')
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'existing-user-id',
      email: 'existing@google.com',
      name: 'Existing User',
      role: 'ADMIN',
      avatar: null,
      provider: 'google',
      providerId: 'google-sub-456',
      password: null,
    });
    mockPrisma.refreshToken.create.mockResolvedValue({});

    const s = await createTestServer();
    server = s.server;

    const res = await fetch(`${s.baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'valid-token-existing' }),
    });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe('existing@google.com');

    // Should NOT create new user
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    // Should NOT update (since provider already 'google')
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it('updates existing user with Google provider if user had no provider', async () => {
    const googlePayload = {
      email: 'local@google.com',
      name: 'Local Turned Google',
      picture: 'https://pic.url/new.jpg',
      sub: 'google-sub-789',
    };

    mockGoogleClient.verifyIdToken.mockResolvedValue({
      getPayload: () => googlePayload,
    });
    // Email found but NO provider (local user logging in with Google)
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'local-user-id',
      email: 'local@google.com',
      name: 'Local User',
      role: 'ADMIN',
      avatar: null,
      provider: null,
      providerId: null,
      password: 'hashed-password',
    });
    mockPrisma.user.update.mockResolvedValue({
      id: 'local-user-id',
      email: 'local@google.com',
      name: 'Local User',
      role: 'ADMIN',
      avatar: 'https://pic.url/new.jpg',
      provider: 'google',
      providerId: 'google-sub-789',
    });
    mockPrisma.refreshToken.create.mockResolvedValue({});

    const s = await createTestServer();
    server = s.server;

    const res = await fetch(`${s.baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'valid-token-local' }),
    });
    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'local-user-id' },
        data: expect.objectContaining({
          provider: 'google',
          providerId: 'google-sub-789',
        }),
      }),
    );
  });

  it('sets password to null for newly created Google users', async () => {
    const googlePayload = {
      email: 'null-pass@google.com',
      name: 'Null Password',
      picture: null,
      sub: 'sub-null-pass',
    };

    mockGoogleClient.verifyIdToken.mockResolvedValue({
      getPayload: () => googlePayload,
    });
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'null-pass-id',
      email: 'null-pass@google.com',
      name: 'Null Password',
      role: 'ADMIN',
      avatar: null,
      provider: 'google',
      providerId: 'sub-null-pass',
      password: null,
    });
    mockPrisma.refreshToken.create.mockResolvedValue({});

    const s = await createTestServer();
    server = s.server;

    await fetch(`${s.baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'token-null-pass' }),
    });

    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ password: null }),
      }),
    );
  });

  it('returns access token and sets refresh cookie', async () => {
    const googlePayload = {
      email: 'cookie@google.com',
      name: 'Cookie Test',
      picture: null,
      sub: 'sub-cookie',
    };

    mockGoogleClient.verifyIdToken.mockResolvedValue({
      getPayload: () => googlePayload,
    });
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'cookie-user-id',
      email: 'cookie@google.com',
      name: 'Cookie Test',
      role: 'ADMIN',
      avatar: null,
      provider: 'google',
      providerId: 'sub-cookie',
      password: null,
    });
    mockPrisma.refreshToken.create.mockResolvedValue({});

    const s = await createTestServer();
    server = s.server;

    const res = await fetch(`${s.baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'token-cookie' }),
    });

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain('edu_refresh_token');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Strict');
    expect(setCookie).toContain('Path=/api/auth');

    const body: any = await res.json();
    expect(body.data.accessToken).toBeTruthy();
    // JWT should be a 3-part token
    expect(body.data.accessToken.split('.')).toHaveLength(3);
  });
});

describe('Auth Middleware — Google JWT Support', () => {
  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = null;
    }
  });

  it('rejects request without Authorization header', async () => {
    const s = await createTestServer();
    server = s.server;

    const res = await fetch(`${s.baseUrl}/api/auth/me`);
    expect(res.status).toBe(401);
  });

  it('accepts custom JWT from Google user', async () => {
    mockSupabaseAdmin.auth.getUser.mockRejectedValue(new Error('Supabase down'));

    mockPrisma.user.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.id === 'google-jwt-user') {
        return {
          id: 'google-jwt-user',
          email: 'google-jwt@test.com',
          name: 'Google JWT User',
          role: 'ADMIN',
          active: true,
          provider: 'google',
        };
      }
      return null;
    });

    // Sign a JWT manually
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { userId: 'google-jwt-user', email: 'google-jwt@test.com', role: 'ADMIN' },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '1h' },
    );

    const s = await createTestServer();
    server = s.server;

    const res = await fetch(`${s.baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
  });

  it('rejects expired custom JWT', async () => {
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { userId: 'expired-user', email: 'expired@test.com', role: 'ADMIN' },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '0s' },
    );

    // Wait a tick for expiry
    await new Promise((r) => setTimeout(r, 50));

    const s = await createTestServer();
    server = s.server;

    const res = await fetch(`${s.baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(401);
  });

  it('rejects custom JWT with wrong secret', async () => {
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { userId: 'wrong-secret-user', email: 'wrong@test.com', role: 'ADMIN' },
      'wrong-secret',
      { expiresIn: '1h' },
    );

    const s = await createTestServer();
    server = s.server;

    const res = await fetch(`${s.baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(401);
  });

  it('rejects custom JWT when user is inactive', async () => {
    mockSupabaseAdmin.auth.getUser.mockRejectedValue(new Error('Supabase down'));
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'inactive-user',
      email: 'inactive@test.com',
      name: 'Inactive',
      role: 'ADMIN',
      active: false,
      provider: 'google',
    });

    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { userId: 'inactive-user', email: 'inactive@test.com', role: 'ADMIN' },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '1h' },
    );

    const s = await createTestServer();
    server = s.server;

    const res = await fetch(`${s.baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout — Google user cleanup', () => {
  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = null;
    }
  });

  it('clears refresh cookie and deletes refresh token', async () => {
    mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
    const s = await createTestServer();
    server = s.server;

    const res = await fetch(`${s.baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: 'edu_refresh_token=test-refresh-token' },
    });

    expect(res.status).toBe(200);
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('edu_refresh_token=');
    // Clear cookie expires in past
    expect(setCookie).toContain('Expires=Thu, 01 Jan 1970');

    expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { token: 'test-refresh-token' } }),
    );
  });
});
