import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createStudentSchema } from '../schemas/student.js';
import { StudentService } from '../services/index.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();
const studentService = new StudentService();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await studentService.list(req);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Gagal mengambil data siswa' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const student = await studentService.getById(req.params.id as string);
    res.json({ success: true, data: student });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.post('/', requireRole('SUPER_ADMIN', 'ADMIN', 'GURU'), validate(createStudentSchema), async (req: AuthRequest, res: Response) => {
  try {
    const student = await studentService.create(req.body as any, req.user?.userId);
    res.status(201).json({ success: true, data: student });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.put('/:id/toggle-spp', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const student = await studentService.toggleSpp(req.params.id as string, req.user?.userId);
    res.json({ success: true, data: student });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.put('/:id/checkin', requireRole('SUPER_ADMIN', 'ADMIN', 'GURU'), async (req: AuthRequest, res: Response) => {
  try {
    const student = await studentService.checkin(req.params.id as string, req.body?.method, req.user?.userId);
    res.json({ success: true, data: student });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

export default router;
