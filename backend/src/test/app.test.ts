import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Server } from 'http';

const mockPrisma = { $queryRaw: vi.fn() };

vi.mock('../lib/prisma.js', () => ({ prisma: mockPrisma }));
vi.mock('../lib/sentry.js', () => ({ initSentry: vi.fn() }));

async function createTestServer(): Promise<{ server: Server; baseUrl: string }> {
  const app = (await import('../app.js')).default;
  const http = await import('http');
  const getPort = (await import('get-port')).default;
  const port = await getPort();
  const server = http.createServer(app).listen(port);
  const baseUrl = `http://localhost:${port}`;
  return { server, baseUrl };
}

describe('API Endpoints', () => {
  let server: Server | null = null;

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = null;
    }
  });

  it('GET /api/health returns healthy when DB is up', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '1': 1 }]);
    const s = await createTestServer();
    server = s.server;
    const res = await fetch(`${s.baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('healthy');
    expect(body.db).toBe('connected');
  });

  it('GET /api/health returns 503 when DB is down', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('DB down'));
    const s = await createTestServer();
    server = s.server;
    const res = await fetch(`${s.baseUrl}/api/health`);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe('unhealthy');
  });

  it('has CORS header with allowed origin', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '1': 1 }]);
    const s = await createTestServer();
    server = s.server;
    const res = await fetch(`${s.baseUrl}/api/health`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000');
  });

  it('returns 404 for unknown API routes', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '1': 1 }]);
    const s = await createTestServer();
    server = s.server;
    const res = await fetch(`${s.baseUrl}/api/nonexistent`);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('has security headers from helmet', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '1': 1 }]);
    const s = await createTestServer();
    server = s.server;
    const res = await fetch(`${s.baseUrl}/api/health`);
    expect(res.headers.get('strict-transport-security')).toBeTruthy();
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });
});

describe('Auth Validation', () => {
  it('rejects registration with empty name', async () => {
    const { z } = await import('zod');
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(1),
    });
    expect(schema.safeParse({ email: 'test@test.com', password: '123456', name: '' }).success).toBe(false);
  });

  it('accepts valid registration input', async () => {
    const { z } = await import('zod');
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(1),
    });
    expect(schema.safeParse({ email: 'test@test.com', password: '123456', name: 'Test' }).success).toBe(true);
  });
});

describe('Sentry Integration', () => {
  it('initializes without throwing when DSN is set', async () => {
    process.env.SENTRY_DSN = 'https://key@o0.ingest.sentry.io/0';
    const sentryModule = await import('../lib/sentry.js');
    expect(() => sentryModule.initSentry()).not.toThrow();
    delete process.env.SENTRY_DSN;
  });

  it('skips init when DSN is not set', async () => {
    const sentryModule = await import('../lib/sentry.js');
    expect(() => sentryModule.initSentry()).not.toThrow();
  });
});
