export interface Siswa {
  id: string;
  name: string;
  classLevel: string;
  performanceScore: number; // 0 - 100
  attendanceRate: number; // 0 - 100
  email: string;
  parentName: string;
  parentEmail: string;
  sppStatus: 'LUNAS' | 'BELUM_BAYAR';
  sppAmount: number;
  progressHistory: { month: string; score: number; attendance: number }[];
  subjectsScore: { name: string; score: number }[];
  qrCodeData: string;
  locationCheckedIn: boolean;
  latitude?: number;
  longitude?: number;
  checkInTime?: string;
  avatar?: string;
}

export interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  rating: number; // 0 - 5
  attendanceRate: number; // 0 - 100
  evaluationScore: number; // 0 - 100 max
  totalClasses: number;
  activeStudents: number;
  avatar?: string;
  evaluations: {
    id: string;
    date: string;
    reviewer: string;
    pedagogical: number; // 1-5
    professional: number; // 1-5
    social: number; // 1-5
    feedback: string;
  }[];
}

export interface Transaksi {
  id: string;
  amount: number;
  type: 'SPP_MASUK' | 'GAJI_GURU' | 'OPERASIONAL' | 'LAIN_LAIN';
  date: string;
  payeeName: string;
  status: 'LUNAS' | 'TERTUNDA' | 'BATAL';
  notes: string;
}

export interface BiayaOperasional {
  id: string;
  itemName: string;
  totalCost: number;
  siswaShare: number; // Biaya per siswa yang setara
  description: string;
  category: 'FASILITAS' | 'GAJI' | 'KURIKULUM' | 'UTILITAS';
}

export interface Schedule {
  id: string;
  classTitle: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  roomCode: string;
  status: 'AKAN_DATANG' | 'SEDANG_BERLANGSUNG' | 'SELESAI';
  date: string;
}

export interface MateriBelajar {
  id: string;
  title: string;
  subject: string;
  targetLevel: string;
  type: 'PDF' | 'VIDEO' | 'TUGAS';
  url: string;
  uploadDate: string;
  downloadsCount: number;
  author: string;
  isLocked: boolean; // strict access control
}

export interface Notifikasi {
  id: string;
  title: string;
  message: string;
  type: 'SPP_INFO' | 'UJIAN_INFO' | 'JADWAL_INFO' | 'PENGUMUMAN';
  timestamp: string;
  read: boolean;
  targetRole: 'ALL' | 'WALI_MURID' | 'SISWA' | 'GURU';
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'FINANCE' | 'GURU' | 'WALI_MURID' | 'SISWA';

export type AuditAction =
  | 'CREATE' | 'UPDATE' | 'DELETE'
  | 'LOGIN' | 'REGISTER'
  | 'CHECKIN' | 'EVALUATE'
  | 'SEED';

export type AuditEntity =
  | 'user' | 'student' | 'teacher'
  | 'transaction' | 'material'
  | 'notification' | 'schedule'
  | 'quiz' | 'attendance';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface InteractiveQuiz {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  questions: QuizQuestion[];
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string | null;
  details: string | null;
  ip: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}
