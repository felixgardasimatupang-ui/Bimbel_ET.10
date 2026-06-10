import { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/index.js';

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
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
}
