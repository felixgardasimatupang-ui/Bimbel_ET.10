import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../../middleware/auth.js';
import { mockPrisma, mockSupabaseAdmin } from '../setup.js';
import type { AuthRequest } from '../../types/index.js';

describe('authenticate middleware', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  describe('missing or invalid Authorization header', () => {
    it('returns 401 when Authorization header is missing', async () => {
      await authenticate(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token tidak ditemukan',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when Authorization header does not start with Bearer', async () => {
      req.headers = { authorization: 'InvalidToken' };

      await authenticate(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token tidak ditemukan',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when token is empty after Bearer prefix', async () => {
      req.headers = { authorization: 'Bearer ' };

      await authenticate(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token tidak ditemukan',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Supabase JWT authentication', () => {
    it('authenticates valid Supabase token with active user', async () => {
      const token = 'valid-supabase-token';
      req.headers = { authorization: `Bearer ${token}` };

      mockSupabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: { id: 'supabase-uid-123', email: 'test@example.com' } },
        error: null,
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        role: 'ADMIN',
        supabaseUid: 'supabase-uid-123',
        active: true,
        name: 'Test User',
        provider: 'supabase',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await authenticate(req as AuthRequest, res as Response, next);

      expect(mockSupabaseAdmin.auth.getUser).toHaveBeenCalledWith(token);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { supabaseUid: 'supabase-uid-123' },
      });
      expect(req.user).toEqual({
        userId: '1',
        email: 'test@example.com',
        role: 'ADMIN',
        supabaseUid: 'supabase-uid-123',
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('falls through when Supabase Auth returns error (tries custom JWT)', async () => {
      const userId = '2';
      const token = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET!);
      req.headers = { authorization: `Bearer ${token}` };

      mockSupabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'google@example.com',
        role: 'GURU',
        supabaseUid: null,
        active: true,
        name: 'Google User',
        provider: 'google',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await authenticate(req as AuthRequest, res as Response, next);

      expect(req.user).toEqual({
        userId: '2',
        email: 'google@example.com',
        role: 'GURU',
        provider: 'google',
      });
      expect(next).toHaveBeenCalled();
    });

    it('returns 401 when Supabase user is inactive', async () => {
      const token = 'valid-supabase-token';
      req.headers = { authorization: `Bearer ${token}` };

      mockSupabaseAdmin.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'supabase-uid-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        role: 'ADMIN',
        supabaseUid: 'supabase-uid-123',
        active: false,
        name: 'Test User',
        provider: 'supabase',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await authenticate(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token tidak valid atau kadaluarsa',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when Supabase user not found in local DB', async () => {
      const token = 'valid-supabase-token';
      req.headers = { authorization: `Bearer ${token}` };

      mockSupabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: { id: 'unknown-uid', email: 'unknown@example.com' } },
        error: null,
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await authenticate(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Custom JWT authentication (Google OAuth)', () => {
    it('authenticates valid custom JWT with active user', async () => {
      const userId = '2';
      const token = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET!);
      req.headers = { authorization: `Bearer ${token}` };

      mockSupabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'google@example.com',
        role: 'GURU',
        supabaseUid: null,
        active: true,
        name: 'Google User',
        provider: 'google',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await authenticate(req as AuthRequest, res as Response, next);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '2' },
      });
      expect(req.user).toEqual({
        userId: '2',
        email: 'google@example.com',
        role: 'GURU',
        provider: 'google',
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 401 when custom JWT user is inactive', async () => {
      const userId = '2';
      const token = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET!);
      req.headers = { authorization: `Bearer ${token}` };

      mockSupabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'google@example.com',
        role: 'GURU',
        supabaseUid: null,
        active: false,
        name: 'Google User',
        provider: 'google',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await authenticate(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token tidak valid atau kadaluarsa',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when custom JWT signature is invalid', async () => {
      const token = 'invalid.jwt.token';
      req.headers = { authorization: `Bearer ${token}` };

      mockSupabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      await authenticate(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token tidak valid atau kadaluarsa',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when both authentication methods fail', async () => {
      const token = 'completely-invalid-token';
      req.headers = { authorization: `Bearer ${token}` };

      mockSupabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      await authenticate(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token tidak valid atau kadaluarsa',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});