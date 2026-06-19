import crypto from 'crypto';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../lib/supabase.js';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest, JwtPayload } from '../types/index.js';

const getJwtSecret = () => process.env.JWT_ACCESS_SECRET || 'ephemeral-' + crypto.randomUUID();

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Token tidak ditemukan' });
    return;
  }

  const token = authHeader.slice(7);
  if (!token) {
    res.status(401).json({ success: false, error: 'Token tidak ditemukan' });
    return;
  }

  // Try 1: Verify as Supabase JWT (existing email/password users)
  if (supabaseAdmin) {
    try {
      const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && supabaseUser) {
        const supabaseUid = supabaseUser.id;
        const dbUser = await prisma.user.findUnique({ where: { supabaseUid } });

        if (dbUser && dbUser.active) {
          req.user = {
            userId: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
            supabaseUid,
          };
          next();
          return;
        }
      }
    } catch {
      // fall through to custom JWT check
    }
  }

  // Try 2: Verify as custom JWT (Google OAuth users)
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    const dbUser = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (dbUser && dbUser.active) {
      req.user = {
        userId: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        provider: dbUser.provider || undefined,
      };
      next();
      return;
    }
  } catch {
    // fall through — both methods failed
  }

  res.status(401).json({ success: false, error: 'Token tidak valid atau kadaluarsa' });
}
