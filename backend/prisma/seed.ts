import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Starting database seed...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.interactiveQuiz.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.subjectScore.deleteMany();
  await prisma.progressHistory.deleteMany();
  await prisma.material.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.user.deleteMany();

  // Users
  const adminPw = await hashPassword('admin123');
  const guruPw = await hashPassword('guru123');
  const siswaPw = await hashPassword('siswa123');

  const admin = await prisma.user.create({
    data: { email: 'admin@bimbel.edu', password: adminPw, name: 'Admin Utama', role: 'ADMIN' as UserRole },
  });
  const guru = await prisma.user.create({
    data: { email: 'guru@bimbel.edu', password: guruPw, name: 'Pengajar Terverifikasi', role: 'GURU' as UserRole },
  });
  const siswa = await prisma.user.create({
    data: { email: 'siswa@bimbel.edu', password: siswaPw, name: 'Siswa Demo', role: 'SISWA' as UserRole },
  });

  console.log(`[SEED] Users: admin@bimbel.edu, guru@bimbel.edu, siswa@bimbel.edu`);

  // Teachers
  const teacher1 = await prisma.teacher.create({
    data: {
      name: 'Dr. Gunawan Saputra, M.Si',
      email: 'gunawan@bimbel.edu',
      subjects: ['Matematika', 'Fisika'],
      rating: 4.7,
      attendanceRate: 98,
      evaluationScore: 90,
      totalClasses: 120,
      activeStudents: 25,
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150',
      evaluations: {
        create: [
          { date: '2026-05-15', reviewer: 'Admin Utama', pedagogical: 5, professional: 5, social: 4, feedback: 'Sangat interaktif dan menguasai materi dengan baik.' },
          { date: '2026-04-10', reviewer: 'Admin Utama', pedagogical: 4, professional: 5, social: 5, feedback: 'Kelas berjalan efektif. Siswa aktif bertanya.' },
        ],
      },
    },
  });

  const teacher2 = await prisma.teacher.create({
    data: {
      name: 'Liem Christian, S.Pd',
      email: 'christian@bimbel.edu',
      subjects: ['Bahasa Inggris'],
      rating: 4.5,
      attendanceRate: 96,
      evaluationScore: 88,
      totalClasses: 98,
      activeStudents: 30,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      evaluations: {
        create: [
          { date: '2026-05-20', reviewer: 'Admin Utama', pedagogical: 5, professional: 4, social: 5, feedback: 'Kreatif dalam mengajar TOEFL dan conversation.' },
        ],
      },
    },
  });

  const teacher3 = await prisma.teacher.create({
    data: {
      name: 'Siti Rahma, S.Si',
      email: 'rahma@bimbel.edu',
      subjects: ['Kimia', 'Biologi'],
      rating: 4.3,
      attendanceRate: 94,
      evaluationScore: 85,
      totalClasses: 85,
      activeStudents: 20,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    },
  });

  console.log('[SEED] Teachers created');

  // Schedules
  const schedules = [
    { teacherId: teacher1.id, classTitle: 'Matematika Sukses UTBK', startTime: '08:30', endTime: '10:30', roomCode: 'LT-03A', status: 'SEDANG_BERLANGSUNG', teacherName: teacher1.name },
    { teacherId: teacher1.id, classTitle: 'Fisika Mekanika & Termodinamika', startTime: '13:00', endTime: '15:00', roomCode: 'LT-07C', status: 'AKAN_DATANG', teacherName: teacher1.name },
    { teacherId: teacher2.id, classTitle: 'TOEFL Masterclass & Academic Writing', startTime: '10:45', endTime: '12:15', roomCode: 'LT-04B', status: 'AKAN_DATANG', teacherName: teacher2.name },
    { teacherId: teacher3.id, classTitle: 'Kimia UTBK Intensive', startTime: '15:30', endTime: '17:30', roomCode: 'LT-02A', status: 'AKAN_DATANG', teacherName: teacher3.name },
  ];

  for (const s of schedules) {
    await prisma.schedule.create({ data: s });
  }

  console.log('[SEED] Schedules created');

  // Students
  const student1 = await prisma.student.create({
    data: {
      name: 'Budi Santoso', classLevel: '12 SMA - IPA', email: 'budi.santoso@siswa.edu',
      parentName: 'Hendra Santoso', parentEmail: 'hendra.s@parent.com',
      sppStatus: 'LUNAS', sppAmount: 750000, performanceScore: 88.5, attendanceRate: 95.8,
      qrCodeData: 'QR-BUDI-SANTOSO-001', locationCheckedIn: true, checkInTime: '07:45',
      latitude: -6.2088, longitude: 106.8456,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      subjectsScore: {
        create: [
          { name: 'Matematika', score: 90 },
          { name: 'Fisika', score: 88 },
          { name: 'Kimia', score: 85 },
          { name: 'B. Inggris', score: 91 },
        ],
      },
      progressHistory: {
        create: [
          { month: 'Jan', score: 82, attendance: 90 },
          { month: 'Feb', score: 85, attendance: 95 },
          { month: 'Mar', score: 84, attendance: 100 },
          { month: 'Apr', score: 87, attendance: 92 },
          { month: 'Mei', score: 88.5, attendance: 98 },
        ],
      },
    },
  });

  const student2 = await prisma.student.create({
    data: {
      name: 'Siti Aminah', classLevel: '12 SMA - IPS', email: 'siti.aminah@siswa.edu',
      parentName: 'Ahmad Malik', parentEmail: 'ahmad.m@parent.com',
      sppStatus: 'BELUM_BAYAR', sppAmount: 750000, performanceScore: 92.1, attendanceRate: 98.2,
      qrCodeData: 'QR-SITI-AMINAH-014', locationCheckedIn: true, checkInTime: '07:38',
      latitude: -6.2102, longitude: 106.8441,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      subjectsScore: {
        create: [
          { name: 'Ekonomi', score: 95 },
          { name: 'Sosiologi', score: 92 },
          { name: 'Geografi', score: 89 },
          { name: 'B. Inggris', score: 93 },
        ],
      },
      progressHistory: {
        create: [
          { month: 'Jan', score: 89, attendance: 100 },
          { month: 'Feb', score: 90, attendance: 98 },
          { month: 'Mar', score: 91, attendance: 96 },
          { month: 'Apr', score: 91.5, attendance: 98 },
          { month: 'Mei', score: 92.1, attendance: 100 },
        ],
      },
    },
  });

  const student3 = await prisma.student.create({
    data: {
      name: 'Doni Herlambang', classLevel: '11 SMA - IPA', email: 'doni.h@siswa.edu',
      parentName: 'Suryo Herlambang', parentEmail: 'suryo.herlambang@parent.com',
      sppStatus: 'LUNAS', sppAmount: 700000, performanceScore: 78.4, attendanceRate: 85.0,
      qrCodeData: 'QR-DONI-HERLAMBANG-052', locationCheckedIn: false,
      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150',
      subjectsScore: {
        create: [
          { name: 'Matematika', score: 75 },
          { name: 'Fisika', score: 80 },
          { name: 'Kimia', score: 78 },
          { name: 'B. Inggris', score: 82 },
        ],
      },
      progressHistory: {
        create: [
          { month: 'Jan', score: 72, attendance: 80 },
          { month: 'Feb', score: 75, attendance: 85 },
          { month: 'Mar', score: 74, attendance: 88 },
          { month: 'Apr', score: 76, attendance: 82 },
          { month: 'Mei', score: 78.4, attendance: 85 },
        ],
      },
    },
  });

  const student4 = await prisma.student.create({
    data: {
      name: 'Rina Wijaya', classLevel: '10 SMA', email: 'rina.w@siswa.edu',
      parentName: 'Budi Wijaya', parentEmail: 'budi.w@parent.com',
      sppStatus: 'BELUM_BAYAR', sppAmount: 650000, performanceScore: 82.0, attendanceRate: 92.0,
      qrCodeData: 'QR-RINA-WIJAYA-089', locationCheckedIn: false,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      subjectsScore: {
        create: [
          { name: 'Matematika', score: 85 },
          { name: 'Fisika', score: 80 },
          { name: 'Kimia', score: 82 },
          { name: 'B. Inggris', score: 78 },
        ],
      },
      progressHistory: {
        create: [
          { month: 'Feb', score: 78, attendance: 88 },
          { month: 'Mar', score: 80, attendance: 90 },
          { month: 'Apr', score: 81, attendance: 91 },
          { month: 'Mei', score: 82, attendance: 92 },
        ],
      },
    },
  });

  console.log('[SEED] Students created');

  // Transactions
  const txs = [
    { studentId: student1.id, amount: 750000, type: 'SPP_MASUK', payeeName: `${student1.id} - ${student1.name} (Wali ${student1.parentName})`, date: new Date('2026-06-05') },
    { studentId: student3.id, amount: 700000, type: 'SPP_MASUK', payeeName: `${student3.id} - ${student3.name} (Wali ${student3.parentName})`, date: new Date('2026-06-03') },
    { studentId: student2.id, amount: 750000, type: 'SPP_MASUK', payeeName: `${student2.id} - ${student2.name} (Wali ${student2.parentName})`, date: new Date('2026-05-28') },
  ];

  for (const tx of txs) {
    await prisma.transaction.create({ data: tx });
  }

  console.log('[SEED] Transactions created');

  // Materials
  const materials = [
    { title: 'Rumus Cepat Integral Tak Tentu', subject: 'Matematika', targetLevel: '12 SMA', type: 'PDF', author: 'Dr. Gunawan Saputra, M.Si' },
    { title: 'Panduan TOEFL Lengkap', subject: 'Bahasa Inggris', targetLevel: '12 SMA', type: 'PDF', author: 'Liem Christian, S.Pd', isLocked: true },
    { title: 'Kimia Dasar: Stoikiometri', subject: 'Kimia', targetLevel: '11 SMA', type: 'VIDEO', author: 'Siti Rahma, S.Si' },
    { title: 'Fisika Inti & Radioaktivitas', subject: 'Fisika', targetLevel: '12 SMA', type: 'TUGAS', author: 'Dr. Gunawan Saputra, M.Si', isLocked: true },
    { title: 'Vocabulary Builder: Academic Word List', subject: 'Bahasa Inggris', targetLevel: '11 SMA', type: 'PDF', author: 'Liem Christian, S.Pd' },
    { title: 'Biologi Sel & Genetika', subject: 'Biologi', targetLevel: '12 SMA', type: 'VIDEO', author: 'Siti Rahma, S.Si' },
  ];

  for (const m of materials) {
    await prisma.material.create({ data: m });
  }

  console.log('[SEED] Materials created');

  // Interactive Quizzes
  const quiz = await prisma.interactiveQuiz.create({
    data: {
      title: 'UTBK Matematika Dasar',
      subject: 'Matematika',
      description: 'Latihan soal UTBK penalaran umum',
      questions: {
        create: [
          { text: 'Berapa hasil dari 25 × 4?', options: ['80', '90', '100', '110'], correctIndex: 2 },
          { text: 'Akar dari 144 adalah...', options: ['10', '11', '12', '13'], correctIndex: 2 },
          { text: 'Nilai dari sin 90° adalah...', options: ['0', '0.5', '1', 'Tidak terdefinisi'], correctIndex: 2 },
        ],
      },
    },
  });

  console.log('[SEED] Quizzes created');

  // Notifications
  await prisma.notification.createMany({
    data: [
      { title: 'Pengingat SPP: Budi Santoso', message: 'Pembayaran SPP akan jatuh tempo dalam 3 hari.', type: 'SPP_INFO', targetRole: 'WALI_MURID' },
      { title: 'Jadwal Try Out UTBK', message: 'Try Out UTBK gelombang 2 akan dilaksanakan Sabtu, 15 Juni 2026.', type: 'UJIAN_INFO', targetRole: 'ALL' },
      { title: 'Modul Baru: Integral Tak Tentu', message: 'Modul baru telah diupload oleh Dr. Gunawan.', type: 'INFO', targetRole: 'ALL' },
    ],
  });

  console.log('[SEED] Notifications created');
  console.log('[SEED] Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('[SEED ERROR]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
