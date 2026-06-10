import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const prisma = new PrismaClient();
const router = Router();

router.use(authenticate);

router.get('/transactions', async (req: Request, res: Response) => {
  const page = req.query.page as string || '1';
  const limit = req.query.limit as string || '50';
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { date: 'desc' },
      include: { student: { select: { name: true, classLevel: true } } },
    }),
    prisma.transaction.count(),
  ]);

  res.json({
    success: true,
    data,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

router.get('/summary', async (_req: Request, res: Response) => {
  const students = await prisma.student.findMany({ where: { active: true } });
  const totalExpected = students.reduce((sum, s) => sum + s.sppAmount, 0);
  const totalCollected = students.filter((s) => s.sppStatus === 'LUNAS').reduce((sum, s) => sum + s.sppAmount, 0);
  const percentCollected = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  const operationalCosts = [
    { itemName: 'Sewa Gedung', totalCost: 8500000, siswaShare: 175000, category: 'INFRASTRUKTUR' },
    { itemName: 'Listrik & Air', totalCost: 3200000, siswaShare: 75000, category: 'UTILITAS' },
    { itemName: 'Gaji Staff', totalCost: 12000000, siswaShare: 250000, category: 'SDM' },
    { itemName: 'ATK', totalCost: 500000, siswaShare: 10000, category: 'OPERASIONAL' },
    { itemName: 'Internet', totalCost: 1500000, siswaShare: 35000, category: 'TEKNOLOGI' },
  ];

  res.json({
    success: true,
    data: {
      totalExpected,
      totalCollected,
      percentCollected,
      operationalCosts,
      totalOperationalCost: operationalCosts.reduce((sum, item) => sum + item.totalCost, 0),
    },
  });
});

router.get('/students/:id/transactions', requireRole('SUPER_ADMIN', 'ADMIN', 'FINANCE'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const txs = await prisma.transaction.findMany({
    where: { studentId: id },
    orderBy: { date: 'desc' },
  });
  res.json({ success: true, data: txs });
});

export default router;
