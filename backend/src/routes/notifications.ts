import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { NotificationService } from '../services/index.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();
const notificationService = new NotificationService();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = await notificationService.list(req.user?.userId, req.user?.role);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Gagal mengambil notifikasi' });
  }
});

router.post('/spp-reminder', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await notificationService.sendSppReminders(req.user?.userId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Gagal mengirim pengingat SPP' });
  }
});

router.post('/exam-reminder', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await notificationService.sendExamReminder(req.user?.userId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Gagal mengirim pengingat ujian' });
  }
});

export default router;
