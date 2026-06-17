import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { TeacherService } from '../services/index.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();
const teacherService = new TeacherService();

const evaluateSchema = z.object({
  pedagogical: z.number().int().min(1).max(5),
  professional: z.number().int().min(1).max(5),
  social: z.number().int().min(1).max(5),
  feedback: z.string().min(1, 'Catatan evaluasi wajib diisi'),
});

router.use(authenticate);

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const data = await teacherService.list();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Gagal mengambil data pengajar' });
  }
});

router.post('/evaluate/:id', requireRole('SUPER_ADMIN', 'ADMIN'), validate(evaluateSchema), async (req: AuthRequest, res: Response) => {
  try {
    const updated = await teacherService.evaluate(req.params.id as string, req.body, req.user?.userId);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

export default router;
