import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { ScheduleService } from '../services/index.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();
const scheduleService = new ScheduleService();

router.use(authenticate);

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const data = await scheduleService.list();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Gagal mengambil jadwal' });
  }
});

export default router;
