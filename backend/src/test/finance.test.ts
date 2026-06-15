import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import type { Server } from 'http';

const mockPrisma = {
  transaction: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
  student: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  user: { findUnique: vi.fn() },
};

vi.mock('../lib/prisma.js', () => ({ prisma: mockPrisma }));
vi.mock('../lib/supabase.js', () => ({
  supabaseAdmin: { auth: { getUser: vi.fn().mockRejectedValue(new Error('Supabase down')) } },
}));
vi.mock('../lib/sentry.js', () => ({ initSentry: vi.fn() }));

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

const mockTransactions = [
  { id: 'tx-00000001', studentId: 'stu-00000001', amount: 750000, type: 'SPP_MASUK', payeeName: 'Budi Santoso', date: new Date().toISOString(), notes: 'SPP Juni', student: { name: 'Budi Santoso', classLevel: '12 SMA - IPA' } },
  { id: 'tx-00000002', studentId: 'stu-00000002', amount: 500000, type: 'SPP_MASUK', payeeName: 'Siti Nurhaliza', date: new Date().toISOString(), notes: 'SPP Juni', student: { name: 'Siti Nurhaliza', classLevel: '11 SMA - IPS' } },
];

describe('Finance API', () => {
  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = null;
    }
    vi.clearAllMocks();
  });

  describe('GET /api/finance/transactions', () => {
    it('returns paginated transactions', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrisma.transaction.count.mockResolvedValue(2);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/finance/transactions');
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
    });

    it('includes student info in transactions', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrisma.transaction.count.mockResolvedValue(2);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/finance/transactions');
      const body: any = await res.json();
      expect(body.data[0].student.name).toBe('Budi Santoso');
    });

    it('handles empty transactions', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);
      mockPrisma.transaction.count.mockResolvedValue(0);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/finance/transactions');
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.data).toHaveLength(0);
    });

    it('paginates correctly with custom limit', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions.slice(0, 1));
      mockPrisma.transaction.count.mockResolvedValue(2);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/finance/transactions?page=1&limit=1');
      const body: any = await res.json();
      expect(body.pagination.limit).toBe(1);
      expect(body.pagination.totalPages).toBe(2);
    });

    it('denies SISWA role', async () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ userId: 'siswa-1', role: 'SISWA' }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '1h' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'siswa-1', role: 'SISWA', active: true, provider: 'google' });

      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/finance/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(403);
    });

    it('allows FINANCE role', async () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ userId: 'finance-1', role: 'FINANCE' }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '1h' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'finance-1', role: 'FINANCE', active: true, provider: 'google' });
      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrisma.transaction.count.mockResolvedValue(2);

      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/finance/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/finance/summary', () => {
    it('returns finance summary with operational costs', async () => {
      const mockStudents = [
        { id: 'stu-1', sppAmount: 750000, sppStatus: 'LUNAS', active: true },
        { id: 'stu-2', sppAmount: 500000, sppStatus: 'BELUM_BAYAR', active: true },
        { id: 'stu-3', sppAmount: 600000, sppStatus: 'LUNAS', active: true },
      ];
      mockPrisma.student.findMany.mockResolvedValue(mockStudents);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/finance/summary');
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.data.totalExpected).toBe(1850000);
      expect(body.data.totalCollected).toBe(1350000);
      expect(body.data.percentCollected).toBe(73);
      expect(body.data.operationalCosts).toHaveLength(5);
    });

    it('returns 0% when no students', async () => {
      mockPrisma.student.findMany.mockResolvedValue([]);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/finance/summary');
      const body: any = await res.json();
      expect(body.data.totalExpected).toBe(0);
      expect(body.data.percentCollected).toBe(0);
    });
  });

  describe('GET /api/finance/students/:id/transactions', () => {
    it('returns transactions for a specific student', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ id: 'stu-00000001' });
      mockPrisma.transaction.findMany.mockResolvedValue([mockTransactions[0]]);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/finance/students/stu-00000001/transactions');
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].amount).toBe(750000);
    });

    it('returns 400 for short ID', async () => {

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/finance/students/123/transactions');
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent student', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/finance/students/stu-00000999/transactions');
      expect(res.status).toBe(404);
    });
  });
});
