import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import type { Server } from 'http';

const mockPrisma = {
  student: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  attendance: { create: vi.fn() },
  transaction: { findFirst: vi.fn(), create: vi.fn() },
  $executeRaw: vi.fn(),
  user: { findUnique: vi.fn() },
  refreshToken: { create: vi.fn() },
  auditLog: { create: vi.fn() },
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

const mockStudents = [
  { id: 'stu-00000001', name: 'Budi Santoso', classLevel: '12 SMA - IPA', email: 'budi@test.com', active: true, sppStatus: 'LUNAS', sppAmount: 750000, parentName: 'Tidak Diketahui', parentEmail: '', qrCodeData: 'QR-BUDI-0001', subjectsScore: [], progressHistory: [] },
  { id: 'stu-00000002', name: 'Siti Nurhaliza', classLevel: '11 SMA - IPS', email: 'siti@test.com', active: true, sppStatus: 'BELUM_BAYAR', sppAmount: 500000, parentName: 'Ahmad', parentEmail: 'ahmad@test.com', qrCodeData: 'QR-SITI-0002', subjectsScore: [], progressHistory: [] },
];

describe('Students API', () => {
  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = null;
    }
    vi.clearAllMocks();
  });

  describe('GET /api/students', () => {
    it('returns paginated student list', async () => {
      mockPrisma.student.findMany.mockResolvedValue(mockStudents);
      mockPrisma.student.count.mockResolvedValue(2);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/students');
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.pagination.total).toBe(2);
    });

    it('filters by search query', async () => {
      mockPrisma.student.findMany.mockResolvedValue([mockStudents[0]]);
      mockPrisma.student.count.mockResolvedValue(1);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/students?search=Budi');
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toBe('Budi Santoso');
    });

    it('filters by class', async () => {
      mockPrisma.student.findMany.mockResolvedValue([mockStudents[0]]);
      mockPrisma.student.count.mockResolvedValue(1);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/students?classFilter=IPA');
      expect(res.status).toBe(200);
    });

    it('handles empty result', async () => {
      mockPrisma.student.findMany.mockResolvedValue([]);
      mockPrisma.student.count.mockResolvedValue(0);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/students');
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.data).toHaveLength(0);
      expect(body.pagination.totalPages).toBe(0);
    });

    it('paginates correctly', async () => {
      const manyStudents = Array.from({ length: 25 }, (_, i) => ({
        ...mockStudents[0], id: `stu-${String(i + 1).padStart(8, '0')}`, name: `Student ${i + 1}`,
      }));
      mockPrisma.student.findMany.mockResolvedValue(manyStudents.slice(0, 10));
      mockPrisma.student.count.mockResolvedValue(25);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/students?page=1&limit=10');
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.data).toHaveLength(10);
      expect(body.pagination.totalPages).toBe(3);
    });
  });

  describe('GET /api/students/:id', () => {
    it('returns a student by ID', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(mockStudents[0]);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/students/stu-00000001');
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.data.name).toBe('Budi Santoso');
    });

    it('returns 400 for short/invalid ID', async () => {

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/students/123');
      expect(res.status).toBe(400);
    });

    it('returns 404 when student not found', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/students/stu-00000999');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/students', () => {
    it('creates a new student', async () => {
      const newStudent = {
        name: 'Ahmad Rizki', classLevel: '10 SMA', email: 'ahmad@test.com', sppAmount: 600000,
      };
      mockPrisma.student.findUnique.mockResolvedValue(null);
      mockPrisma.student.create.mockResolvedValue({
        ...newStudent, id: 'stu-00000003', active: true, parentName: 'Tidak Diketahui', parentEmail: '',
        sppStatus: 'BELUM_BAYAR', qrCodeData: 'QR-AHMAD-0003', subjectsScore: [], progressHistory: [],
      });

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/students', {
        method: 'POST', body: JSON.stringify(newStudent),
      });
      expect(res.status).toBe(201);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.email).toBe('ahmad@test.com');
    });

    it('returns 409 when email already exists', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(mockStudents[0]);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/students', {
        method: 'POST',
        body: JSON.stringify({ name: 'Duplicate', classLevel: '10', email: 'budi@test.com', sppAmount: 500000 }),
      });
      expect(res.status).toBe(409);
    });

    it('returns 400 for invalid input', async () => {

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/students', {
        method: 'POST',
        body: JSON.stringify({ name: '', classLevel: '', email: 'invalid', sppAmount: 0 }),
      });
      expect(res.status).toBe(400);
    });

    it('denies SISWA role from creating students', async () => {
      const mockUser = vi.fn().mockRejectedValue(new Error('Supabase down'));
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ userId: 'siswa-1', email: 'siswa@test.com', role: 'SISWA' }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '1h' });
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'siswa-1', role: 'SISWA', active: true, provider: 'google' });

      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/students`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', classLevel: '10', email: 'test@test.com', sppAmount: 500000 }),
      });
      expect(res.status).toBe(403);
    });

    it('allows GURU role to create students', async () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ userId: 'guru-1', email: 'guru@test.com', role: 'GURU' }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '1h' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'guru-1', role: 'GURU', active: true, provider: 'google' });
      mockPrisma.student.findUnique.mockResolvedValue(null);
      mockPrisma.student.create.mockResolvedValue({
        id: 'stu-guru-01', name: 'Guru Create', classLevel: '10', email: 'gc@test.com', sppAmount: 500000,
        active: true, parentName: 'Tidak Diketahui', parentEmail: '', sppStatus: 'BELUM_BAYAR',
        subjectsScore: [], progressHistory: [],
      });

      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/students`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Guru Create', classLevel: '10', email: 'gc@test.com', sppAmount: 500000 }),
      });
      expect(res.status).toBe(201);
    });
  });

  describe('PUT /api/students/:id/toggle-spp', () => {
    it('toggles SPP from BELUM_BAYAR to LUNAS', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ ...mockStudents[1] });
      mockPrisma.student.update.mockResolvedValue({ ...mockStudents[1], sppStatus: 'LUNAS' });
      mockPrisma.transaction.findFirst.mockResolvedValue(null);
      mockPrisma.transaction.create.mockResolvedValue({ id: 'tx-00000001' });

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/students/stu-00000002/toggle-spp', { method: 'PUT' });
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.data.sppStatus).toBe('LUNAS');
      expect(mockPrisma.transaction.create).toHaveBeenCalled();
    });

    it('toggles SPP from LUNAS to BELUM_BAYAR', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ ...mockStudents[0] });
      mockPrisma.student.update.mockResolvedValue({ ...mockStudents[0], sppStatus: 'BELUM_BAYAR' });

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/students/stu-00000001/toggle-spp', { method: 'PUT' });
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.data.sppStatus).toBe('BELUM_BAYAR');
      expect(mockPrisma.transaction.create).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/students/:id/checkin', () => {
    it('performs checkin for a student', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(mockStudents[0]);
      mockPrisma.$executeRaw.mockResolvedValue([]);
      mockPrisma.student.findUnique.mockResolvedValueOnce(mockStudents[0]).mockResolvedValueOnce(mockStudents[0]);
      mockPrisma.attendance.create.mockResolvedValue({});

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/students/stu-00000001/checkin', {
        method: 'PUT', body: JSON.stringify({ method: 'MANUAL' }),
      });
      expect(res.status).toBe(200);
    });

    it('rejects checkin for non-existent student', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/students/stu-00000999/checkin', {
        method: 'PUT', body: JSON.stringify({ method: 'QR_SCAN' }),
      });
      expect(res.status).toBe(404);
    });
  });
});
