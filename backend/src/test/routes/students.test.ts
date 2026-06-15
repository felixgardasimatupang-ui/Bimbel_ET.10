import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import studentRoutes from '../../routes/students.js';
import { mockPrisma, mockSupabaseAdmin } from '../setup.js';
import jwt from 'jsonwebtoken';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/students', studentRoutes);
  return app;
}

function validToken(): string {
  return jwt.sign({ userId: '1', email: 'admin@test.com', role: 'ADMIN' }, process.env.JWT_ACCESS_SECRET!);
}

function authHeader(token?: string): string {
  return `Bearer ${token || validToken()}`;
}

describe('Students Routes (GET/POST /api/students)', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createApp();
    mockSupabaseAdmin.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-uid', email: 'admin@test.com' } },
      error: null,
    });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: '1',
      email: 'admin@test.com',
      role: 'ADMIN',
      supabaseUid: 'admin-uid',
      active: true,
      name: 'Admin',
      provider: 'supabase',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe('GET / (list students)', () => {
    it('returns paginated student list', async () => {
      const students = [
        { id: 'student-1', name: 'Alice', email: 'alice@test.com', classLevel: 'XII-A', active: true, sppAmount: 500000, sppStatus: 'LUNAS' as const, parentName: 'Parent A', parentEmail: 'parent@test.com', performanceScore: 85, attendanceRate: 90, qrCodeData: 'QR-ALICE', subjectsScore: [], progressHistory: [], attendances: [], transactions: [], createdAt: new Date(), updatedAt: new Date() },
        { id: 'student-2', name: 'Bob', email: 'bob@test.com', classLevel: 'XII-A', active: true, sppAmount: 500000, sppStatus: 'BELUM_BAYAR' as const, parentName: 'Parent B', parentEmail: 'parent@test.com', performanceScore: 75, attendanceRate: 80, qrCodeData: 'QR-BOB', subjectsScore: [], progressHistory: [], attendances: [], transactions: [], createdAt: new Date(), updatedAt: new Date() },
      ];

      mockPrisma.student.findMany.mockResolvedValue(students);
      mockPrisma.student.count.mockResolvedValue(2);

      const res = await request(app)
        .get('/api/students')
        .set('Authorization', authHeader());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it('applies search filter', async () => {
      mockPrisma.student.findMany.mockResolvedValue([]);
      mockPrisma.student.count.mockResolvedValue(0);

      await request(app)
        .get('/api/students?search=Alice')
        .set('Authorization', authHeader());

      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'Alice', mode: 'insensitive' } }),
            ]),
          }),
        }),
      );
    });

    it('applies class filter', async () => {
      mockPrisma.student.findMany.mockResolvedValue([]);
      mockPrisma.student.count.mockResolvedValue(0);

      await request(app)
        .get('/api/students?classFilter=XII-A')
        .set('Authorization', authHeader());

      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            classLevel: { contains: 'XII-A', mode: 'insensitive' },
          }),
        }),
      );
    });
  });

  describe('GET /:id (single student)', () => {
    it('returns student by ID', async () => {
      const student = {
        id: 'student-12345678',
        name: 'Alice',
        email: 'alice@test.com',
        classLevel: 'XII-A',
        active: true,
        sppAmount: 500000,
        sppStatus: 'LUNAS' as const,
        parentName: 'Parent A',
        parentEmail: 'parent@test.com',
        performanceScore: 85,
        attendanceRate: 90,
        qrCodeData: 'QR-ALICE',
        subjectsScore: [],
        progressHistory: [],
        attendances: [],
        transactions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.student.findUnique.mockResolvedValue(student);

      const res = await request(app)
        .get('/api/students/student-12345678')
        .set('Authorization', authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('student-12345678');
      expect(res.body.data.name).toBe('Alice');
    });

    it('returns 400 for invalid (short) ID', async () => {
      const res = await request(app)
        .get('/api/students/short')
        .set('Authorization', authHeader());

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ID siswa tidak valid');
    });

    it('returns 404 when student not found', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/students/valid-id-123456789')
        .set('Authorization', authHeader());

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Siswa tidak ditemukan');
    });
  });

  describe('POST / (create student)', () => {
    it('creates student with valid data', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null);
      mockPrisma.student.create.mockResolvedValue({
        id: 'new-student-id',
        name: 'Budi',
        classLevel: 'X-A',
        email: 'budi@test.com',
        parentName: 'Parent Budi',
        parentEmail: 'parent@test.com',
        sppAmount: 300000,
        sppStatus: 'BELUM_BAYAR' as const,
        performanceScore: 80,
        attendanceRate: 100,
        qrCodeData: 'QR-BUDI-1234',
        active: true,
        subjectsScore: [],
        progressHistory: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/students')
        .set('Authorization', authHeader())
        .send({
          name: 'Budi',
          classLevel: 'X-A',
          email: 'budi@test.com',
          parentName: 'Parent Budi',
          parentEmail: 'parent@test.com',
          sppAmount: 300000,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('returns 409 when email already exists', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: 'budi@test.com',
      } as any);

      const res = await request(app)
        .post('/api/students')
        .set('Authorization', authHeader())
        .send({
          name: 'Budi',
          classLevel: 'X-A',
          email: 'budi@test.com',
          sppAmount: 300000,
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Email siswa sudah terdaftar');
    });

    it('returns 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', authHeader())
        .send({ name: 'Budi' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/students')
        .send({ name: 'Budi', classLevel: 'X-A', email: 'budi@test.com', sppAmount: 300000 });

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /:id/toggle-spp', () => {
    it('toggles SPP status from BELUM_BAYAR to LUNAS', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ id: 'student-12345678', sppStatus: 'BELUM_BAYAR', sppAmount: 500000, name: 'Alice', parentName: 'Parent' } as any);
      mockPrisma.student.update.mockResolvedValue({ id: 'student-12345678', sppStatus: 'LUNAS' } as any);
      mockPrisma.transaction.findFirst.mockResolvedValue(null);
      mockPrisma.transaction.create.mockResolvedValue({ id: 'tx-1' } as any);

      const res = await request(app)
        .put('/api/students/student-12345678/toggle-spp')
        .set('Authorization', authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data.sppStatus).toBe('LUNAS');
    });
  });
});