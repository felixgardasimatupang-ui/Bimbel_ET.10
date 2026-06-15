import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import type { Server } from 'http';

const mockPrisma = {
  schedule: { findMany: vi.fn() },
  notification: { findMany: vi.fn(), createMany: vi.fn(), create: vi.fn() },
  student: { findMany: vi.fn() },
  auditLog: { findMany: vi.fn(), count: vi.fn() },
  user: { findUnique: vi.fn() },
};

vi.mock('../lib/prisma.js', () => ({ prisma: mockPrisma }));
vi.mock('../lib/supabase.js', () => ({
  supabaseAdmin: { auth: { getUser: vi.fn().mockRejectedValue(new Error('Supabase down')) } },
}));
vi.mock('../lib/sentry.js', () => ({ initSentry: vi.fn() }));
vi.mock('../utils/audit.js', () => ({ createAuditLog: vi.fn() }));

process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

const AUTH_USER = { id: 'admin-1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN', active: true, provider: 'google' };

let server: Server | null = null;

async function createTestServer(): Promise<{ server: Server; baseUrl: string }> {
  const app = (await import('../app.js')).default;
  const http = await import('http');
  const getPort = (await import('get-port')).default;
  const port = await getPort();
  const s = http.createServer(app).listen(port);
  return { server: s, baseUrl: `http://localhost:${port}` };
}

function signToken(payload: Record<string, unknown>): string {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, { expiresIn: '1h' });
}

async function authedFetch(baseUrl: string, path: string, options: RequestInit = {}) {
  const token = signToken({ userId: 'admin-1', role: 'ADMIN' });
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  mockPrisma.user.findUnique.mockResolvedValue(AUTH_USER);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Schedules API', () => {
  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = null;
    }
    vi.clearAllMocks();
  });

  it('GET /api/schedules returns schedules', async () => {
    const mockSchedules = [
      { id: 'sch-1', title: 'Math Class', startTime: new Date().toISOString(), endTime: new Date().toISOString(), day: 'Monday', teacher: 'Dr. Sarah' },
    ];
    mockPrisma.schedule.findMany.mockResolvedValue(mockSchedules);

    const s = await createTestServer();
    server = s.server;
    const res = await authedFetch(s.baseUrl, '/api/schedules');
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data).toHaveLength(1);
  });

  it('handles empty schedules', async () => {
    mockPrisma.schedule.findMany.mockResolvedValue([]);

    const s = await createTestServer();
    server = s.server;
    const res = await authedFetch(s.baseUrl, '/api/schedules');
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data).toHaveLength(0);
  });
});

describe('Notifications API', () => {
  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = null;
    }
    vi.clearAllMocks();
  });

  it('GET /api/notifications returns notifications', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([
      { id: 'notif-1', title: 'SPP Reminder', message: 'Pay your SPP', type: 'SPP_INFO', timestamp: new Date().toISOString() },
    ]);

    const s = await createTestServer();
    server = s.server;
    const res = await authedFetch(s.baseUrl, '/api/notifications');
    expect(res.status).toBe(200);
  });

  it('filters notifications for WALI_MURID role', async () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: 'wali-1', role: 'WALI_MURID' }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '1h' });
    mockPrisma.notification.findMany.mockResolvedValue([]);
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'wali-1', role: 'WALI_MURID', active: true, provider: 'google' });

    const s = await createTestServer();
    server = s.server;
    const res = await fetch(`${s.baseUrl}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      }),
    );
  });

  it('POST /api/notifications/spp-reminder sends reminders', async () => {
    mockPrisma.student.findMany.mockResolvedValue([
      { id: 'stu-1', name: 'Budi', parentName: 'Parent', sppAmount: 500000, sppStatus: 'BELUM_BAYAR', active: true },
    ]);
    mockPrisma.notification.createMany.mockResolvedValue({ count: 1 });

    const s = await createTestServer();
    server = s.server;
    const res = await authedFetch(s.baseUrl, '/api/notifications/spp-reminder', { method: 'POST' });
    expect(res.status).toBe(200);
  });

  it('POST /api/notifications/spp-reminder returns early when all paid', async () => {
    mockPrisma.student.findMany.mockResolvedValue([]);

    const s = await createTestServer();
    server = s.server;
    const res = await authedFetch(s.baseUrl, '/api/notifications/spp-reminder', { method: 'POST' });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.message).toContain('Semua siswa');
  });

  it('POST /api/notifications/exam-reminder sends exam reminder', async () => {
    mockPrisma.notification.create.mockResolvedValue({});

    const s = await createTestServer();
    server = s.server;
    const res = await authedFetch(s.baseUrl, '/api/notifications/exam-reminder', { method: 'POST' });
    expect(res.status).toBe(200);
  });
});

describe('Audit Logs API', () => {
  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = null;
    }
    vi.clearAllMocks();
  });

  it('GET /api/audit-logs returns paginated logs', async () => {
    const mockLogs = [
      { id: 'log-1', action: 'LOGIN', entity: 'user', entityId: 'user-1', createdAt: new Date().toISOString(), user: { id: 'user-1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' } },
    ];
    mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);
    mockPrisma.auditLog.count.mockResolvedValue(1);

    const s = await createTestServer();
    server = s.server;
    const res = await authedFetch(s.baseUrl, '/api/audit-logs');
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.pagination.total).toBe(1);
  });

  it('filters by action and entity', async () => {
    mockPrisma.auditLog.findMany.mockResolvedValue([]);
    mockPrisma.auditLog.count.mockResolvedValue(0);

    const s = await createTestServer();
    server = s.server;
    const res = await authedFetch(s.baseUrl, '/api/audit-logs?action=LOGIN&entity=user');
    expect(res.status).toBe(200);
  });

  it('filters by date range', async () => {
    mockPrisma.auditLog.findMany.mockResolvedValue([]);
    mockPrisma.auditLog.count.mockResolvedValue(0);

    const s = await createTestServer();
    server = s.server;
    const res = await authedFetch(s.baseUrl, '/api/audit-logs?startDate=2026-01-01&endDate=2026-06-30');
    expect(res.status).toBe(200);
  });

  it('denies non-admin roles', async () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: 'guru-1', role: 'GURU' }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '1h' });
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'guru-1', role: 'GURU', active: true, provider: 'google' });

    const s = await createTestServer();
    server = s.server;
    const res = await fetch(`${s.baseUrl}/api/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
  });
});
