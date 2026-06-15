import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import type { Server } from 'http';

const mockPrisma = {
  material: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
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

const mockMaterials = [
  { id: 'mat-00000001', title: 'Matematika Dasar', subject: 'Matematika', targetLevel: '10 SMA', type: 'PDF', author: 'Administrator', isLocked: false, downloadsCount: 5, active: true, createdAt: new Date().toISOString() },
  { id: 'mat-00000002', title: 'Fisika Mekanika', subject: 'Fisika', targetLevel: '11 SMA', type: 'VIDEO', author: 'Pengajar Terverifikasi', isLocked: true, downloadsCount: 3, active: true, createdAt: new Date().toISOString() },
];

describe('Materials API', () => {
  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = null;
    }
    vi.clearAllMocks();
  });

  describe('GET /api/materials', () => {
    it('returns all materials for admin', async () => {
      mockPrisma.material.findMany.mockResolvedValue(mockMaterials);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/materials');
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.data).toHaveLength(2);
    });

    it('filters locked materials for SISWA role', async () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ userId: 'siswa-1', role: 'SISWA' }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '1h' });
      mockPrisma.material.findMany.mockResolvedValue([mockMaterials[0]]);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'siswa-1', role: 'SISWA', active: true, provider: 'google' });

      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/materials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.data).toHaveLength(1);
      expect(mockPrisma.material.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isLocked: false }),
        }),
      );
    });

    it('filters by subject', async () => {
      mockPrisma.material.findMany.mockResolvedValue([mockMaterials[0]]);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/materials?subjectFilter=Matematika');
      expect(res.status).toBe(200);
    });

    it('filters by search query', async () => {
      mockPrisma.material.findMany.mockResolvedValue([mockMaterials[0]]);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/materials?search=Dasar');
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/materials', () => {
    it('creates a new material', async () => {
      const newMaterial = { title: 'Kimia Organik', subject: 'Kimia', targetLevel: '12 SMA', type: 'PDF' };
      mockPrisma.material.create.mockResolvedValue({
        ...newMaterial, id: 'mat-00000003', isLocked: false, author: 'Administrator', downloadsCount: 0, active: true, createdAt: new Date().toISOString(),
      });

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/materials', {
        method: 'POST', body: JSON.stringify(newMaterial),
      });
      expect(res.status).toBe(201);
      const body: any = await res.json();
      expect(body.data.title).toBe('Kimia Organik');
    });

    it('returns 400 for missing required fields', async () => {

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/materials', {
        method: 'POST', body: JSON.stringify({ title: '', subject: '', targetLevel: '', type: 'INVALID' }),
      });
      expect(res.status).toBe(400);
    });

    it('denies SISWA role', async () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ userId: 'siswa-1', role: 'SISWA' }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '1h' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'siswa-1', role: 'SISWA', active: true, provider: 'google' });

      const s = await createTestServer();
      server = s.server;
      const res = await fetch(`${s.baseUrl}/api/materials`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test', subject: 'Math', targetLevel: '10', type: 'PDF' }),
      });
      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/materials/:id/download', () => {
    it('increments download count', async () => {
      mockPrisma.material.findUnique.mockResolvedValue(mockMaterials[0]);
      mockPrisma.material.update.mockResolvedValue({ ...mockMaterials[0], downloadsCount: 6 });

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/materials/mat-00000001/download', { method: 'PUT' });
      expect(res.status).toBe(200);
      expect(mockPrisma.material.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { downloadsCount: { increment: 1 } } }),
      );
    });

    it('returns 400 for short ID', async () => {

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/materials/123/download', { method: 'PUT' });
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent material', async () => {
      mockPrisma.material.findUnique.mockResolvedValue(null);

      const s = await createTestServer();
      server = s.server;
      const res = await authedFetch(s.baseUrl, '/api/materials/mat-00000999/download', { method: 'PUT' });
      expect(res.status).toBe(404);
    });
  });
});
