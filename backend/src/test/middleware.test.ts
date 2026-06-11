import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('RBAC Middleware', () => {
  function createRequireRole() {
    return (...roles: string[]) => {
      return (req: any, res: any, next: any) => {
        if (!req.user) {
          res.status(401).json({ success: false, error: 'Unauthenticated' });
          return;
        }
        if (!roles.includes(req.user.role)) {
          res.status(403).json({
            success: false,
            error: `Akses ditolak. Hanya ${roles.join(' / ')} yang dapat mengakses ini.`,
          });
          return;
        }
        next();
      };
    };
  }

  let requireRole: ReturnType<typeof createRequireRole>;
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    requireRole = createRequireRole();
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  it('allows access when role matches', () => {
    mockReq = { user: { userId: '1', role: 'ADMIN' } };
    const middleware = requireRole('ADMIN', 'SUPER_ADMIN');
    middleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('denies access when role does not match', () => {
    mockReq = { user: { userId: '1', role: 'GURU' } };
    const middleware = requireRole('ADMIN', 'SUPER_ADMIN');
    middleware(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(403);
  });

  it('denies access when not authenticated', () => {
    mockReq = { user: undefined };
    const middleware = requireRole('ADMIN');
    middleware(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  it('requires explicit SUPER_ADMIN role for SUPER_ADMIN-only routes', () => {
    mockReq = { user: { userId: '1', role: 'ADMIN' } };
    const middleware = requireRole('SUPER_ADMIN');
    middleware(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(403);
  });

  it('denies SISWA for admin routes', () => {
    mockReq = { user: { userId: '1', role: 'SISWA' } };
    const middleware = requireRole('ADMIN', 'SUPER_ADMIN');
    middleware(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(403);
  });
});

describe('Validate Middleware', () => {
  function createValidate(schema: any, source: string = 'body') {
    return (req: any, res: any, next: any) => {
      const result = schema.safeParse(req[source]);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: 'Validasi gagal',
          details: result.error.flatten().fieldErrors,
        });
        return;
      }
      req[source] = result.data;
      next();
    };
  }

  let mockReq: any;
  let mockRes: any;
  let mockNext: any;
  let schema: any;

  beforeEach(() => {
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
    schema = {
      safeParse: vi.fn(),
    };
  });

  it('passes validation and calls next', () => {
    schema.safeParse.mockReturnValue({ success: true, data: { name: 'Test' } });
    mockReq = { body: { name: 'Test' } };
    const middleware = createValidate(schema);
    middleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.body).toEqual({ name: 'Test' });
  });

  it('returns 400 on validation failure', () => {
    schema.safeParse.mockReturnValue({
      success: false,
      error: { flatten: () => ({ fieldErrors: { name: ['Required'] } }) },
    });
    mockReq = { body: {} };
    const middleware = createValidate(schema);
    middleware(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });
});
