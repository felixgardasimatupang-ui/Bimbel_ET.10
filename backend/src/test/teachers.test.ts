import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import type { Server } from 'http';

const mockPrisma = {
  teacher: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  evaluation: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  user: { findUnique: vi.fn() },
  refreshToken: { create: vi.fn() },
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
  const token = signToken({ userId: 'admin-1', email: 'admin@test.com', role: 'ADMIN' });
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

const mockTeachers = [
  { id: 'tch-00000001', name: 'Dr. Sarah', subject: 'Matematika', rating: 4.5, evaluationScore: 90, active: true, evaluations: [] },
  { id: 'tch-00000002', name: 'Mr. John', subject: 'Fisika', rating: 4.0, evaluationScore: 80, active: true, evaluations: [] },
];

describe('Teachers API', () => {
  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = null;
    }
    vi.clearAllMocks();
  });

  describe('GET /api/teachers', () => {
    it('returns active teachers sorted by rating', async () => {
      mockPrisma.teacher.findMany.mockResolvedValue(mockTeachers);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', active: true });

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/teachers');
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].name).toBe('Dr. Sarah');
    });

    it('includes evaluations', async () => {
      mockPrisma.teacher.findMany.mockResolvedValue([
        { ...mockTeachers[0], evaluations: [{ id: 'ev-1', date: '2026-01-01', pedagogical: 5, professional: 4, social: 5, feedback: 'Excellent', reviewer: 'Admin' }] },
        mockTeachers[1],
      ]);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', active: true });

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/teachers');
      const body: any = await res.json();
      expect(body.data[0].evaluations).toHaveLength(1);
      expect(body.data[0].evaluations[0].feedback).toBe('Excellent');
    });

    it('handles empty teacher list', async () => {
      mockPrisma.teacher.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', active: true });

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/teachers');
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.data).toHaveLength(0);
    });
  });

  describe('POST /api/teachers/evaluate/:id', () => {
    it('evaluates a teacher successfully', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeachers[0]);
      mockPrisma.evaluation.create.mockResolvedValue({});
      mockPrisma.evaluation.findMany.mockResolvedValue([
        { pedagogical: 5, professional: 4, social: 5 },
        { pedagogical: 4, professional: 5, social: 4 },
      ]);
      mockPrisma.teacher.update.mockResolvedValue({
        ...mockTeachers[0], rating: 4.5, evaluationScore: 90, evaluations: [],
      });

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/teachers/evaluate/tch-00000001', {
        method: 'POST',
        body: JSON.stringify({ pedagogical: 5, professional: 4, social: 5, feedback: 'Great teacher' }),
      });
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
    });

    it('returns 400 for invalid ID', async () => {
      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/teachers/evaluate/123', {
        method: 'POST',
        body: JSON.stringify({ pedagogical: 5, professional: 4, social: 5, feedback: 'Good' }),
      });
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent teacher', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/teachers/evaluate/tch-00000999', {
        method: 'POST',
        body: JSON.stringify({ pedagogical: 5, professional: 4, social: 5, feedback: 'Good' }),
      });
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid score out of range', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeachers[0]);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/teachers/evaluate/tch-00000001', {
        method: 'POST',
        body: JSON.stringify({ pedagogical: 6, professional: 4, social: 5, feedback: 'Good' }),
      });
      expect(res.status).toBe(400);
    });

    it('returns 400 for empty feedback', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeachers[0]);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/teachers/evaluate/tch-00000001', {
        method: 'POST',
        body: JSON.stringify({ pedagogical: 4, professional: 4, social: 4, feedback: '' }),
      });
      expect(res.status).toBe(400);
    });

    it('denies GURU role from evaluating', async () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ userId: 'guru-1', email: 'guru@test.com', role: 'GURU' }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '1h' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'guru-1', role: 'GURU', active: true, provider: 'google' });

      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/teachers/evaluate/tch-00000001`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedagogical: 5, professional: 4, social: 5, feedback: 'Good' }),
      });
      expect(res.status).toBe(403);
    });
  });
});
