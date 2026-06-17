import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { MaterialService } from '../services/index.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();
const materialService = new MaterialService();

const createSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  subject: z.string().min(1, 'Subjek wajib diisi'),
  targetLevel: z.string().min(1, 'Tingkat kelas wajib diisi'),
  type: z.enum(['PDF', 'VIDEO', 'TUGAS']),
  isLocked: z.boolean().optional().default(false),
});

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = await materialService.list(
      req.query.search as string | undefined,
      req.query.subjectFilter as string | undefined,
      req.user?.role,
    );
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Gagal mengambil data materi' });
  }
});

router.post('/', requireRole('SUPER_ADMIN', 'ADMIN', 'GURU'), validate(createSchema), async (req: AuthRequest, res: Response) => {
  try {
    const material = await materialService.create(req.body, req.user?.userId);
    res.status(201).json({ success: true, data: material });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.put('/:id/download', async (req: AuthRequest, res: Response) => {
  try {
    const material = await materialService.incrementDownload(req.params.id as string);
    res.json({ success: true, data: material });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

export default router;
