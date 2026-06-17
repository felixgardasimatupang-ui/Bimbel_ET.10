import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { AuditService } from '../services/index.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();
const auditService = new AuditService();

router.use(authenticate);

router.get('/', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await auditService.list({
      page: req.query.page as string | undefined,
      limit: req.query.limit as string | undefined,
      action: req.query.action as string | undefined,
      entity: req.query.entity as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Gagal mengambil log audit' });
  }
});

export default router;
