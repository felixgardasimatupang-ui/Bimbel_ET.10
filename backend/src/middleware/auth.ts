import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from '../types/index.js';

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Token tidak ditemukan' });
    return;
  }

  try {
    const token = authHeader.slice(7);
    if (!token) {
      res.status(401).json({ success: false, error: 'Token tidak ditemukan' });
      return;
    }
    const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !supabaseUser) {
      res.status(401).json({ success: false, error: 'Token tidak valid atau kadaluarsa' });
      return;
    }

    const supabaseUid = supabaseUser.id;
    const dbUser = await prisma.user.findUnique({ where: { supabaseUid } });

    if (!dbUser || !dbUser.active) {
      res.status(401).json({ success: false, error: 'User tidak ditemukan atau tidak aktif' });
      return;
    }

    req.user = {
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      supabaseUid,
    };

    next();
  } catch {
    res.status(401).json({ success: false, error: 'Token tidak valid atau kadaluarsa' });
  }
}
