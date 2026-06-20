import { Router, Response } from 'express';
import { z } from 'zod';
import QRCode from 'qrcode';
import { AttendanceStatus, AttendanceMethod, AuditAction, AuditEntity } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';
import { createAuditLog } from '../utils/audit.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

router.get('/qr-session', async (req: AuthRequest, res: Response) => {
  const activeSession = await prisma.qrSession.findFirst({
    where: {
      active: true,
      validUntil: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!activeSession) {
    res.status(404).json({ success: false, error: 'Tidak ada sesi QR aktif' });
    return;
  }

  let qrImageUrl = '';
  try {
    qrImageUrl = await QRCode.toDataURL(activeSession.code, {
      width: 300,
      margin: 1,
      color: { dark: '#1e293b', light: '#ffffff' },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal generate QR code' });
    return;
  }

  res.json({
    success: true,
    data: {
      sessionId: activeSession.id,
      code: activeSession.code,
      courseName: activeSession.courseName,
      validUntil: activeSession.validUntil,
      generatedAt: activeSession.createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      qrImage: qrImageUrl,
      hqLatitude: activeSession.hqLatitude,
      hqLongitude: activeSession.hqLongitude,
      maxDistance: activeSession.maxDistance,
    },
  });
});

router.use(authenticate);

router.post('/qr-session/regenerate', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  await prisma.qrSession.updateMany({
    where: { active: true },
    data: { active: false },
  });

  const randCode = `QR-CLASS-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();
  const validUntil = new Date(now.getTime() + 8 * 60 * 60 * 1000);

  const newSession = await prisma.qrSession.create({
    data: {
      code: randCode,
      courseName: 'Matematika Sukses UTBK',
      validUntil,
      hqLatitude: -6.2088,
      hqLongitude: 106.8456,
      maxDistance: 20.0,
      active: true,
    },
  });

  await createAuditLog({
    userId: req.user?.userId,
    action: AuditAction.CREATE,
    entity: AuditEntity.attendance,
    entityId: newSession.id,
    details: `Regenerated QR session: ${randCode}`,
  });

  let qrImageUrl = '';
  try {
    qrImageUrl = await QRCode.toDataURL(newSession.code, {
      width: 300,
      margin: 1,
      color: { dark: '#1e293b', light: '#ffffff' },
    });
  } catch {
    qrImageUrl = '';
  }

  res.json({
    success: true,
    data: {
      sessionId: newSession.id,
      code: newSession.code,
      courseName: newSession.courseName,
      validUntil: newSession.validUntil,
      generatedAt: newSession.createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      qrImage: qrImageUrl,
      hqLatitude: newSession.hqLatitude,
      hqLongitude: newSession.hqLongitude,
      maxDistance: newSession.maxDistance,
    },
  });
});

const checkinQrSchema = z.object({
  studentId: z.string().min(8, 'ID siswa tidak valid'),
  qrCode: z.string().min(1, 'QR code wajib diisi'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

router.post('/checkin/qr', requireRole('SUPER_ADMIN', 'ADMIN', 'GURU', 'SISWA'), validate(checkinQrSchema), async (req: AuthRequest, res: Response) => {
  const { studentId, qrCode } = req.body;

  const session = await prisma.qrSession.findFirst({
    where: {
      code: qrCode,
      active: true,
      validUntil: { gte: new Date() },
    },
  });

  if (!session) {
    res.status(400).json({ success: false, error: 'Kode QR tidak valid atau sudah kadaluarsa' });
    return;
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    res.status(404).json({ success: false, error: 'Siswa tidak ditemukan' });
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existingAttendance = await prisma.attendance.findFirst({
    where: {
      studentId,
      date: { gte: today },
    },
  });

  if (existingAttendance) {
    res.status(400).json({ success: false, error: 'Siswa sudah presensi hari ini' });
    return;
  }

  const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const { latitude, longitude } = req.body;

  const updates: string[] = [
    'location_checked_in = true',
    `check_in_time = ${timeNow}`,
    'performance_score = LEAST(100.0, COALESCE(performance_score, 0.0) + 1.2)',
    'attendance_rate = LEAST(100.0, COALESCE(attendance_rate, 0.0) + 2.5)',
  ];
  if (latitude != null && longitude != null) {
    updates.push(`latitude = ${latitude}`);
    updates.push(`longitude = ${longitude}`);
  }

  await prisma.$executeRawUnsafe(`
    UPDATE students
    SET ${updates.join(', ')}
    WHERE id = $1
  `, studentId);

  const attendance = await prisma.attendance.create({
    data: {
      studentId,
      status: AttendanceStatus.HADIR,
      method: AttendanceMethod.QR_SCAN,
      checkInTime: timeNow,
      ...(latitude != null && longitude != null ? { latitude, longitude } : {}),
    },
  });

  await createAuditLog({
    userId: req.user?.userId,
    action: AuditAction.CHECKIN,
    entity: AuditEntity.attendance,
    entityId: attendance.id,
    details: `QR checkin: ${student.name}`,
  });

  const updatedStudent = await prisma.student.findUnique({
    where: { id: studentId },
    include: { subjectsScore: true, progressHistory: true },
  });

  res.json({ success: true, data: updatedStudent, message: `${student.name} berhasil presensi via QR Code` });
});

const checkinGpsSchema = z.object({
  studentId: z.string().min(8, 'ID siswa tidak valid'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

router.post('/checkin/gps', requireRole('SUPER_ADMIN', 'ADMIN', 'GURU', 'SISWA'), validate(checkinGpsSchema), async (req: AuthRequest, res: Response) => {
  const { studentId, latitude, longitude } = req.body;

  const session = await prisma.qrSession.findFirst({
    where: {
      active: true,
      validUntil: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!session) {
    res.status(400).json({ success: false, error: 'Tidak ada sesi presensi aktif' });
    return;
  }

  const distance = calculateDistance(latitude, longitude, session.hqLatitude, session.hqLongitude);

  if (distance > session.maxDistance) {
    res.status(400).json({
      success: false,
      error: `Lokasi terlalu jauh dari kampus (${Math.round(distance)}m). Maksimal ${session.maxDistance}m`,
      distance: Math.round(distance),
    });
    return;
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    res.status(404).json({ success: false, error: 'Siswa tidak ditemukan' });
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existingAttendance = await prisma.attendance.findFirst({
    where: {
      studentId,
      date: { gte: today },
    },
  });

  if (existingAttendance) {
    res.status(400).json({ success: false, error: 'Siswa sudah presensi hari ini' });
    return;
  }

  const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  await prisma.$executeRaw`
    UPDATE students
    SET
      location_checked_in = true,
      check_in_time = ${timeNow},
      latitude = ${latitude},
      longitude = ${longitude},
      performance_score = LEAST(100.0, COALESCE(performance_score, 0.0) + 1.2),
      attendance_rate = LEAST(100.0, COALESCE(attendance_rate, 0.0) + 2.5)
    WHERE id = ${studentId}
  `;

  const attendance = await prisma.attendance.create({
    data: {
      studentId,
      status: AttendanceStatus.HADIR,
      method: AttendanceMethod.LOKASI,
      checkInTime: timeNow,
      latitude,
      longitude,
    },
  });

  await createAuditLog({
    userId: req.user?.userId,
    action: AuditAction.CHECKIN,
    entity: AuditEntity.attendance,
    entityId: attendance.id,
    details: `GPS checkin: ${student.name} (${Math.round(distance)}m dari kampus)`,
  });

  const updatedStudent = await prisma.student.findUnique({
    where: { id: studentId },
    include: { subjectsScore: true, progressHistory: true },
  });

  res.json({
    success: true,
    data: updatedStudent,
    message: `${student.name} berhasil presensi via GPS (${Math.round(distance)}m dari kampus)`,
    distance: Math.round(distance),
  });
});

// GET /today — attendance records for today
router.get('/today', async (req: AuthRequest, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const records = await prisma.attendance.findMany({
    where: {
      date: { gte: today, lt: tomorrow },
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          classLevel: true,
          email: true,
          avatar: true,
          locationCheckedIn: true,
          checkInTime: true,
          latitude: true,
          longitude: true,
          performanceScore: true,
          attendanceRate: true,
          sppStatus: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  const session = await prisma.qrSession.findFirst({
    where: { active: true, validUntil: { gte: new Date() } },
    orderBy: { createdAt: 'desc' },
    select: { hqLatitude: true, hqLongitude: true, maxDistance: true, code: true, courseName: true },
  });

  res.json({ success: true, data: records, session });
});

export default router;
