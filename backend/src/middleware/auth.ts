import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import type { AuthRequest } from '../types/index.js';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Token tidak ditemukan' });
    return;
  }

  try {
    const token = authHeader.slice(7);
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Token tidak valid atau kadaluarsa' });
  }
}
