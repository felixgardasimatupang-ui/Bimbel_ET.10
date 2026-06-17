import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { FinanceService } from '../services/index.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();
const financeService = new FinanceService();

router.use(authenticate);

router.get('/transactions', requireRole('SUPER_ADMIN', 'ADMIN', 'FINANCE'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await financeService.getTransactions(req.query.page as string | undefined, req.query.limit as string | undefined);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Gagal mengambil data transaksi' });
  }
});

router.get('/summary', requireRole('SUPER_ADMIN', 'ADMIN', 'FINANCE'), async (_req: AuthRequest, res: Response) => {
  try {
    const data = await financeService.getSummary();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Gagal mengambil ringkasan keuangan' });
  }
});

router.get('/students/:id/transactions', requireRole('SUPER_ADMIN', 'ADMIN', 'FINANCE'), async (req: AuthRequest, res: Response) => {
  try {
    const data = await financeService.getStudentTransactions(req.params.id as string);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

export default router;
