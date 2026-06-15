import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response, NextFunction } from 'express';
import { requireRole } from '../../middleware/rbac.js';
import type { AuthRequest } from '../../types/index.js';

describe('requireRole middleware', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  describe('unauthenticated requests', () => {
    it('returns 401 when user is not authenticated', () => {
      const middleware = requireRole('ADMIN');
      
      middleware(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthenticated',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when req.user is undefined', () => {
      req.user = undefined;
      const middleware = requireRole('SUPER_ADMIN', 'ADMIN');

      middleware(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthenticated',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('role authorization', () => {
    it('allows access when user has required role', () => {
      req.user = {
        userId: '1',
        email: 'admin@test.com',
        role: 'ADMIN',
      };
      const middleware = requireRole('ADMIN');

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('allows access when user has one of multiple required roles', () => {
      req.user = {
        userId: '2',
        email: 'finance@test.com',
        role: 'FINANCE',
      };
      const middleware = requireRole('SUPER_ADMIN', 'ADMIN', 'FINANCE');

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 403 when user role is not in allowed list', () => {
      req.user = {
        userId: '3',
        email: 'guru@test.com',
        role: 'GURU',
      };
      const middleware = requireRole('SUPER_ADMIN', 'ADMIN');

      middleware(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Akses ditolak. Hanya SUPER_ADMIN / ADMIN yang dapat mengakses ini.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 with correct message for single role requirement', () => {
      req.user = {
        userId: '4',
        email: 'siswa@test.com',
        role: 'SISWA',
      };
      const middleware = requireRole('ADMIN');

      middleware(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Akses ditolak. Hanya ADMIN yang dapat mengakses ini.',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('allows SUPER_ADMIN access to SUPER_ADMIN-only endpoint', () => {
      req.user = {
        userId: '1',
        email: 'superadmin@test.com',
        role: 'SUPER_ADMIN',
      };
      const middleware = requireRole('SUPER_ADMIN');

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('handles case-sensitive role matching correctly', () => {
      req.user = {
        userId: '5',
        email: 'user@test.com',
        role: 'admin', // lowercase
      };
      const middleware = requireRole('ADMIN'); // uppercase

      middleware(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('works with all five roles in allowlist', () => {
      req.user = {
        userId: '6',
        email: 'siswa@test.com',
        role: 'SISWA',
      };
      const middleware = requireRole('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'GURU', 'SISWA');

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});