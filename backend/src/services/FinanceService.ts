import { SppStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';

function parseIntSafe(val: string | undefined, defaultVal: number, min: number, max: number): number {
  const n = parseInt(val || String(defaultVal), 10);
  if (isNaN(n)) return defaultVal;
  return Math.max(min, Math.min(max, n));
}

export class FinanceService {
  async getTransactions(page?: string, limit?: string) {
    const pageNum = parseIntSafe(page, 1, 1, Infinity);
    const limitNum = parseIntSafe(limit, 50, 1, 100);

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { date: 'desc' },
        include: { student: { select: { name: true, classLevel: true } } },
      }),
      prisma.transaction.count(),
    ]);

    return {
      data,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    };
  }

  async getSummary() {
    const students = await prisma.student.findMany({ where: { active: true } });
    const totalExpected = students.reduce((sum, s) => sum + s.sppAmount, 0);
    const totalCollected = students.filter((s) => s.sppStatus === SppStatus.LUNAS).reduce((sum, s) => sum + s.sppAmount, 0);
    const percentCollected = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    const operationalCosts = [
      { itemName: 'Sewa Gedung', totalCost: 8500000, siswaShare: 175000, category: 'INFRASTRUKTUR' },
      { itemName: 'Listrik & Air', totalCost: 3200000, siswaShare: 75000, category: 'UTILITAS' },
      { itemName: 'Gaji Staff', totalCost: 12000000, siswaShare: 250000, category: 'SDM' },
      { itemName: 'ATK', totalCost: 500000, siswaShare: 10000, category: 'OPERASIONAL' },
      { itemName: 'Internet', totalCost: 1500000, siswaShare: 35000, category: 'TEKNOLOGI' },
    ];

    return {
      totalExpected,
      totalCollected,
      percentCollected,
      operationalCosts,
      totalOperationalCost: operationalCosts.reduce((sum, item) => sum + item.totalCost, 0),
    };
  }

  async getStudentTransactions(studentId: string) {
    if (!studentId || studentId.length < 8) throw new AppError(400, 'ID siswa tidak valid');

    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { id: true } });
    if (!student) throw new AppError(404, 'Siswa tidak ditemukan');

    return prisma.transaction.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    });
  }
}
