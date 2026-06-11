import { createContext, useContext, useState, useCallback, useMemo, useRef, type ReactNode, type FormEvent } from 'react';
import type { Siswa, Teacher, Transaksi, MateriBelajar, Notifikasi, Schedule, UserRole, InteractiveQuiz } from '../types';
import {
  INITIAL_SISWA, INITIAL_TEACHERS, INITIAL_TRANSACTIONS,
  INITIAL_SCHEDULES, INITIAL_MATERI,
  INITIAL_QUIZZES, INITIAL_NOTIFIKASI,
} from '../data/mockData';
import { usePersistedState } from '../hooks/usePersistedState';
import { createId, validateEmail, sanitizeCSV, GPS_DEFAULT, calculateQuizScore } from '../utils/validation';
import { useToast } from '../hooks/useToast';
import { useSync } from '../hooks/useSync';
import { useAuth } from './AuthContext';

interface FormDataSiswa {
  name: string; classLevel: string; email: string;
  parentName: string; parentEmail: string; sppAmount: number;
}

interface FormDataMateri {
  title: string; subject: string; targetLevel: string;
  type: 'PDF' | 'VIDEO' | 'TUGAS'; isLocked: boolean;
}

interface QrSession {
  sessionId: string; courseName: string; code: string; generatedAt: string;
}

export interface DataContextValue {
  // Data
  siswas: Siswa[];
  teachers: Teacher[];
  transactions: Transaksi[];
  schedules: Schedule[];
  materis: MateriBelajar[];
  quizzes: InteractiveQuiz[];
  notifs: Notifikasi[];

  // Mutations
  setSiswas: React.Dispatch<React.SetStateAction<Siswa[]>>;
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaksi[]>>;
  setMateris: React.Dispatch<React.SetStateAction<MateriBelajar[]>>;
  setNotifs: React.Dispatch<React.SetStateAction<Notifikasi[]>>;

  // UI State
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedSiswaId: string;
  setSelectedSiswaId: (id: string) => void;
  studentSearch: string;
  setStudentSearch: (val: string) => void;
  studentClassFilter: string;
  setStudentClassFilter: (val: string) => void;
  materiSearch: string;
  setMateriSearch: (val: string) => void;
  materiSubjectFilter: string;
  setMateriSubjectFilter: (val: string) => void;

  // Form state
  newSiswaOpen: boolean;
  setNewSiswaOpen: (val: boolean) => void;
  formDataSiswa: FormDataSiswa;
  setFormDataSiswa: React.Dispatch<React.SetStateAction<FormDataSiswa>>;
  newMateriOpen: boolean;
  setNewMateriOpen: (val: boolean) => void;
  formDataMateri: FormDataMateri;
  setFormDataMateri: React.Dispatch<React.SetStateAction<FormDataMateri>>;

  // Quiz state
  activeQuizPlay: InteractiveQuiz | null;
  quizAnswers: Record<string, number>;
  quizResult: { score: number; total: number } | null;

  // QR & GPS
  qrSession: QrSession;
  gpsLoading: boolean;
  gpsLocation: { lat: number; lon: number } | null;

  // Teacher eval
  evalTeacherId: string;
  setEvalTeacherId: (id: string) => void;
  pedagogicalScore: number;
  setPedagogicalScore: (val: number) => void;
  professionalScore: number;
  setProfessionalScore: (val: number) => void;
  socialScore: number;
  setSocialScore: (val: number) => void;
  evalFeedback: string;
  setEvalFeedback: (val: string) => void;

  // Computed
  filteredSiswas: Siswa[];
  filteredMateris: MateriBelajar[];
  totalSPPExpected: number;
  totalSPPCollected: number;
  percentSPPCollected: number;
  performanceTrendData: Array<{ name: string; RataNilai: number; Kehadiran: number; SPP_Pemasukan: number }>;
  activeStudentName: string;

  // Actions
  handleAddSiswa: (e: FormEvent) => void;
  handleAddMateri: (e: FormEvent) => void;
  handleStartQuiz: (quiz: InteractiveQuiz) => void;
  handleSelectQuizAnswer: (qId: string, optIndex: number) => void;
  handleSubmitQuiz: () => void;
  handleCloseQuiz: () => void;
  toggleSppPaymentStatus: (siswaId: string) => void;
  simulateCheckinSiswa: (siswaId: string, method: 'QR_SCAN' | 'LOKASI') => void;
  queryBrowserGeolocation: () => void;
  handleRegenerateQr: () => void;
  handleSubmitTeacherEvaluation: (e: FormEvent) => void;
  exportToCSV: () => void;
  triggerAutomatedSPPNotification: () => void;
  triggerExamReminderNotification: () => void;
  handleDownloadMateri: (id: string) => void;

  // System
  toast: { message: string; type: 'success' | 'warn' | 'info' } | null;
  offlineMode: boolean;
  pendingSyncCount: number;
  isSyncing: boolean;
  syncLogs: string[];
  handleSyncData: () => void;
  toggleOfflineMode: () => void;
}

const DataCtx = createContext<DataContextValue | null>(null);

export function useData() {
  const ctx = useContext(DataCtx);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();
  const { toast, triggerToast } = useToast();
  const {
    offlineMode, pendingSyncCount, isSyncing, syncLogs, addSyncLog, trackOfflineChange, handleSyncData, toggleOfflineMode,
  } = useSync(triggerToast);

  // Persisted data
  const [siswas, setSiswas] = usePersistedState<Siswa[]>('edu_siswas', INITIAL_SISWA);
  const [teachers, setTeachers] = usePersistedState<Teacher[]>('edu_teachers', INITIAL_TEACHERS);
  const [transactions, setTransactions] = usePersistedState<Transaksi[]>('edu_transactions', INITIAL_TRANSACTIONS);
  const [schedules] = usePersistedState<Schedule[]>('edu_schedules', INITIAL_SCHEDULES);
  const [materis, setMateris] = usePersistedState<MateriBelajar[]>('edu_materis', INITIAL_MATERI);
  const [quizzes] = usePersistedState<InteractiveQuiz[]>('edu_quizzes', INITIAL_QUIZZES);
  const [notifs, setNotifs] = usePersistedState<Notifikasi[]>('edu_notifs', INITIAL_NOTIFIKASI);

  // UI state
  const [activeTab, setActiveTab] = useState('ringkasan');
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>(INITIAL_SISWA[0]?.id ?? '');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('Semua');
  const [materiSearch, setMateriSearch] = useState('');
  const [materiSubjectFilter, setMateriSubjectFilter] = useState('Semua');

  const currentUserRole = authUser?.role || 'ADMIN';

  // Form state
  const [newSiswaOpen, setNewSiswaOpen] = useState(false);
  const [formDataSiswa, setFormDataSiswa] = useState<FormDataSiswa>({
    name: '', classLevel: '12 SMA - IPA', email: '',
    parentName: '', parentEmail: '', sppAmount: 750000,
  });
  const [newMateriOpen, setNewMateriOpen] = useState(false);
  const [formDataMateri, setFormDataMateri] = useState<FormDataMateri>({
    title: '', subject: 'Matematika', targetLevel: '12 SMA',
    type: 'PDF', isLocked: false,
  });

  // Quiz state
  const [activeQuizPlay, setActiveQuizPlay] = useState<InteractiveQuiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; total: number } | null>(null);

  // QR & GPS
  const [qrSession, setQrSession] = useState<QrSession>({
    sessionId: 'SES-2026-991', courseName: 'Matematika Sukses UTBK',
    code: 'QR-ATTEND-MATH-2026', generatedAt: '10:00',
  });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lon: number } | null>(null);

  // Teacher eval
  const [evalTeacherId, setEvalTeacherId] = useState('TCH-001');
  const [pedagogicalScore, setPedagogicalScore] = useState(5);
  const [professionalScore, setProfessionalScore] = useState(4);
  const [socialScore, setSocialScore] = useState(5);
  const [evalFeedback, setEvalFeedback] = useState('');

  // Rate limiting
  const rateLimitTimers = useRef<Record<string, number>>({});
  const checkRateLimit = useCallback((key: string, ms = 500): boolean => {
    const now = Date.now();
    const last = rateLimitTimers.current[key] ?? 0;
    if (now - last < ms) {
      triggerToast('Operasi terlalu cepat. Silakan tunggu.', 'warn');
      return false;
    }
    rateLimitTimers.current[key] = now;
    return true;
  }, [triggerToast]);

  const requireRole = useCallback((allowedRoles: UserRole[], action: string): boolean => {
    if (!allowedRoles.includes(currentUserRole as UserRole)) {
      triggerToast(`Akses ditolak. Hanya ${allowedRoles.join(' / ')} yang dapat ${action}.`, 'warn');
      return false;
    }
    return true;
  }, [currentUserRole, triggerToast]);

  // Computed
  const filteredSiswas = useMemo(() => siswas.filter((s) => {
    const q = studentSearch.toLowerCase();
    const matchesSearch = s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.parentName.toLowerCase().includes(q);
    const matchesClass = studentClassFilter === 'Semua' || s.classLevel.includes(studentClassFilter);
    return matchesSearch && matchesClass;
  }), [siswas, studentSearch, studentClassFilter]);

  const filteredMateris = useMemo(() => materis.filter((m) => {
    const q = materiSearch.toLowerCase();
    const matchesSearch = m.title.toLowerCase().includes(q) || m.author.toLowerCase().includes(q);
    const matchesSub = materiSubjectFilter === 'Semua' || m.subject.toLowerCase() === materiSubjectFilter.toLowerCase();
    if (currentUserRole === 'SISWA' && m.isLocked) return false;
    return matchesSearch && matchesSub;
  }), [materis, materiSearch, materiSubjectFilter, currentUserRole]);

  const totalSPPExpected = useMemo(() => siswas.reduce((sum, s) => sum + s.sppAmount, 0), [siswas]);
  const totalSPPCollected = useMemo(() => siswas.filter((s) => s.sppStatus === 'LUNAS').reduce((sum, s) => sum + s.sppAmount, 0), [siswas]);
  const percentSPPCollected = useMemo(() => totalSPPExpected > 0 ? Math.round((totalSPPCollected / totalSPPExpected) * 100) : 0, [totalSPPCollected, totalSPPExpected]);

  const performanceTrendData = useMemo(() => [
    { name: 'Jan', RataNilai: 79, Kehadiran: 85, SPP_Pemasukan: 12000000 },
    { name: 'Feb', RataNilai: 82, Kehadiran: 90, SPP_Pemasukan: 15400000 },
    { name: 'Mar', RataNilai: 85, Kehadiran: 92, SPP_Pemasukan: 18900000 },
    { name: 'Apr', RataNilai: 86.4, Kehadiran: 94, SPP_Pemasukan: 21000000 },
    { name: 'Mei', RataNilai: 88.2, Kehadiran: 96, SPP_Pemasukan: 24500000 },
    {
      name: 'Juni (Real)',
      RataNilai: siswas.length > 0 ? Math.round((siswas.reduce((acc, s) => acc + s.performanceScore, 0) / siswas.length) * 10) / 10 : 0,
      Kehadiran: siswas.length > 0 ? Math.round((siswas.reduce((acc, s) => acc + s.attendanceRate, 0) / siswas.length) * 10) / 10 : 0,
      SPP_Pemasukan: totalSPPCollected,
    },
  ], [siswas, totalSPPCollected]);

  const activeStudentName = useMemo(() => {
    if (siswas.length === 0) return 'Tidak Ada Siswa';
    return [...siswas].sort((a, b) => b.performanceScore - a.performanceScore)[0].name;
  }, [siswas]);

  // Actions
  const handleAddSiswa = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (!checkRateLimit('addSiswa')) return;
    if (!requireRole(['ADMIN', 'GURU'], 'mendaftarkan siswa')) return;
    if (!formDataSiswa.name || !formDataSiswa.email) {
      triggerToast('Nama Lengkap dan Surel Siswa wajib diisi!', 'warn');
      return;
    }
    if (!validateEmail(formDataSiswa.email)) {
      triggerToast('Format surel siswa tidak valid!', 'warn');
      return;
    }
    if (formDataSiswa.parentEmail && !validateEmail(formDataSiswa.parentEmail)) {
      triggerToast('Format surel wali murid tidak valid!', 'warn');
      return;
    }
    if (formDataSiswa.sppAmount <= 0) {
      triggerToast('Nominal SPP harus lebih dari 0!', 'warn');
      return;
    }
    const newStudent: Siswa = {
      id: createId('SIS'), name: formDataSiswa.name, classLevel: formDataSiswa.classLevel,
      performanceScore: 80.0, attendanceRate: 100.0, email: formDataSiswa.email,
      parentName: formDataSiswa.parentName || 'Tidak Diketahui',
      parentEmail: formDataSiswa.parentEmail || '',
      sppStatus: 'BELUM_BAYAR', sppAmount: formDataSiswa.sppAmount,
      progressHistory: [{ month: 'Apr', score: 80, attendance: 100 }, { month: 'Mei', score: 80, attendance: 100 }],
      subjectsScore: [
        { name: 'Matematika', score: 80 }, { name: 'Fisika', score: 80 },
        { name: 'Kimia', score: 80 }, { name: 'B. Inggris', score: 80 },
      ],
      qrCodeData: `QR-${formDataSiswa.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString().slice(-4)}`,
      locationCheckedIn: false,
    };
    setSiswas((prev) => [...prev, newStudent]);
    setNewSiswaOpen(false);
    setFormDataSiswa({ name: '', classLevel: '12 SMA - IPA', email: '', parentName: '', parentEmail: '', sppAmount: 750000 });
    triggerToast(`Siswa ${newStudent.name} sukses didaftarkan!`, 'success');
    addSyncLog(`Registered new student ${newStudent.name} with unique QR identifier.`);
    trackOfflineChange();
  }, [formDataSiswa, setSiswas, triggerToast, addSyncLog, trackOfflineChange, checkRateLimit, requireRole]);

  const handleAddMateri = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (!checkRateLimit('addMateri')) return;
    if (!requireRole(['ADMIN', 'GURU'], 'mengunggah materi')) return;
    if (!formDataMateri.title) {
      triggerToast('Judul materi belajar tidak boleh kosong!', 'warn');
      return;
    }
    if (!formDataMateri.targetLevel.trim()) {
      triggerToast('Tingkat kelas sasaran wajib diisi!', 'warn');
      return;
    }
    const newMat: MateriBelajar = {
      id: createId('MAT'),
      title: formDataMateri.title, subject: formDataMateri.subject,
      targetLevel: formDataMateri.targetLevel, type: formDataMateri.type,
      url: '#', uploadDate: new Date().toISOString().split('T')[0],
      downloadsCount: 0,
      author: currentUserRole === 'ADMIN' ? 'Administrator' : 'Pengajar Terverifikasi',
      isLocked: formDataMateri.isLocked,
    };
    setMateris((prev) => [...prev, newMat]);
    setNewMateriOpen(false);
    setFormDataMateri({ title: '', subject: 'Matematika', targetLevel: '12 SMA', type: 'PDF', isLocked: false });
    triggerToast(`Materi "${newMat.title}" berhasil diunggah dan terindeks!`, 'success');
    addSyncLog(`Uploaded new learning topic: "${newMat.title}" locked state: ${newMat.isLocked}`);
    trackOfflineChange();
  }, [formDataMateri, currentUserRole, setMateris, triggerToast, addSyncLog, trackOfflineChange, checkRateLimit, requireRole]);

  const simulateCheckinSiswa = useCallback((siswaId: string, checkInMethod: 'QR_SCAN' | 'LOKASI') => {
    if (!checkRateLimit('checkin', 300)) return;
    if (!requireRole(['ADMIN', 'GURU'], 'melakukan presensi')) return;
    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    let studentName = 'Siswa';
    setSiswas((prev) => prev.map((student) => {
      if (student.id === siswaId) {
        studentName = student.name;
        return {
          ...student, locationCheckedIn: true, checkInTime: timeNow,
          performanceScore: Math.min(100, Math.round((student.performanceScore + 1.2) * 10) / 10),
          attendanceRate: Math.min(100, Math.round((student.attendanceRate + 2.5) * 10) / 10),
          latitude: GPS_DEFAULT.lat + (Math.random() - 0.5) * 0.0001,
          longitude: GPS_DEFAULT.lon + (Math.random() - 0.5) * 0.0001,
        };
      }
      return student;
    }));
    triggerToast(`Absensi terdeteksi via ${checkInMethod}! Jam: ${timeNow}. Poin performa ${studentName} meningkat (+1.2)!`, 'success');
    addSyncLog(`Student verified attendance using ${checkInMethod}: ${studentName}`);
    trackOfflineChange();
  }, [setSiswas, triggerToast, addSyncLog, trackOfflineChange, checkRateLimit, requireRole]);

  const queryBrowserGeolocation = useCallback(() => {
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
          setGpsLoading(false);
          triggerToast(`Satelit GPS sinkron! Koordinat Anda: ${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`, 'success');
          addSyncLog(`Retrieved real geolocalization coordinates from client: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        },
        () => {
          setGpsLocation(GPS_DEFAULT);
          setGpsLoading(false);
          triggerToast('Otorisasi GPS dibatasi atau browser offline. Menggunakan koordinat HQ Bimbel Jakarta (+/- 5m).', 'info');
          addSyncLog('Simulated geolocation lock within school vicinity.');
        },
      );
    } else {
      setGpsLocation(GPS_DEFAULT);
      setGpsLoading(false);
      triggerToast('Akses geolokasi tidak didukung oleh browser ini.', 'warn');
    }
  }, [triggerToast, addSyncLog]);

  const handleSubmitTeacherEvaluation = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (!checkRateLimit('evalTeacher')) return;
    if (!requireRole(['ADMIN'], 'mengevaluasi pengajar')) return;
    if (!evalFeedback.trim()) {
      triggerToast('Catatan evaluasi tidak boleh kosong!', 'warn');
      return;
    }
    const scores = [pedagogicalScore, professionalScore, socialScore];
    if (scores.some((s) => s < 1 || s > 5)) {
      triggerToast('Skor evaluasi harus antara 1-5!', 'warn');
      return;
    }
    const average = Math.round(((pedagogicalScore + professionalScore + socialScore) / 3) * 10) / 10;
    const targetTch = teachers.find((t) => t.id === evalTeacherId);
    setTeachers((prev) => prev.map((t) => {
      if (t.id === evalTeacherId) {
        const newEval = {
          id: `EV-${Date.now()}`, date: new Date().toISOString().split('T')[0],
          reviewer: 'Admin Utama (Sesi Evaluasi Berkala)',
          pedagogical: pedagogicalScore, professional: professionalScore,
          social: socialScore, feedback: evalFeedback || 'Performa mengajar yang dipertahankan dengan evaluasi berkala.',
        };
        const newEvaluations = [newEval, ...t.evaluations];
        const newOverallRating = Math.round((newEvaluations.reduce((acc, ev) => acc + (ev.pedagogical + ev.professional + ev.social) / 3, 0) / newEvaluations.length) * 10) / 10;
        return { ...t, rating: newOverallRating, evaluationScore: Math.min(100, Math.round((newOverallRating / 5) * 100)), evaluations: newEvaluations };
      }
      return t;
    }));
    triggerToast(`Evaluasi pengajar ${targetTch?.name} berhasil direkam ke database!`, 'success');
    addSyncLog(`Submitted regular score review for ${targetTch?.name}: Avg: ${average}/5.0`);
    setEvalFeedback('');
    trackOfflineChange();
  }, [evalTeacherId, pedagogicalScore, professionalScore, socialScore, evalFeedback, teachers, setTeachers, triggerToast, addSyncLog, trackOfflineChange, checkRateLimit, requireRole]);

  const handleStartQuiz = useCallback((quiz: InteractiveQuiz) => {
    setActiveQuizPlay(quiz);
    setQuizAnswers({});
    setQuizResult(null);
  }, []);

  const handleSelectQuizAnswer = useCallback((qId: string, optIndex: number) => {
    setQuizAnswers((prev) => ({ ...prev, [qId]: optIndex }));
  }, []);

  const handleSubmitQuiz = useCallback(() => {
    if (!checkRateLimit('submitQuiz')) return;
    if (!activeQuizPlay) return;
    if (activeQuizPlay.questions.length === 0) {
      triggerToast('Kuis tidak memiliki pertanyaan!', 'warn');
      return;
    }
    if (!selectedSiswaId) {
      triggerToast('Pilih siswa terlebih dahulu di panel Ringkasan!', 'warn');
      return;
    }
    const calculatedScore = calculateQuizScore(quizAnswers, activeQuizPlay.questions);
    setQuizResult({ score: calculatedScore, total: activeQuizPlay.questions.length });
    setSiswas((prev) => prev.map((s) => {
      if (s.id === selectedSiswaId) {
        const updatedSubjects = s.subjectsScore.map((sub) => {
          if (sub.name.toLowerCase() === activeQuizPlay.subject.toLowerCase()) {
            return { ...sub, score: Math.min(100, Math.round((sub.score + calculatedScore) / 2)) };
          }
          return sub;
        });
        const newPerfScore = Math.round((updatedSubjects.reduce((acc, curr) => acc + curr.score, 0) / updatedSubjects.length) * 10) / 10;
        return { ...s, subjectsScore: updatedSubjects, performanceScore: newPerfScore };
      }
      return s;
    }));
    triggerToast(`Kuis selesai! Nilai Siswa: ${calculatedScore}. Performa siswa di-update real-time.`, 'success');
    addSyncLog(`Student submitted interactive quiz test score ${calculatedScore}% for subject ${activeQuizPlay.subject}`);
    trackOfflineChange();
  }, [activeQuizPlay, quizAnswers, selectedSiswaId, setSiswas, triggerToast, addSyncLog, trackOfflineChange, checkRateLimit]);

  const toggleSppPaymentStatus = useCallback((siswaId: string) => {
    if (!checkRateLimit('toggleSpp')) return;
    if (!requireRole(['ADMIN'], 'mengubah status SPP')) return;
    const targetStudent = siswas.find((s) => s.id === siswaId);
    setSiswas((prev) => prev.map((s) => {
      if (s.id === siswaId) {
        const nextStatus = s.sppStatus === 'LUNAS' ? 'BELUM_BAYAR' as const : 'LUNAS' as const;
        if (nextStatus === 'LUNAS') {
          const existingThisMonth = transactions.some((tx) =>
            tx.payeeName.includes(s.id) && tx.type === 'SPP_MASUK' &&
            tx.date.startsWith(new Date().toISOString().split('T')[0].slice(0, 7))
          );
          if (!existingThisMonth) {
            const newTx: Transaksi = {
              id: createId('TX'),
              amount: s.sppAmount, type: 'SPP_MASUK',
              date: new Date().toISOString().split('T')[0],
              payeeName: `${s.id} - ${s.name} (Wali ${s.parentName})`,
              status: 'LUNAS', notes: 'SPP pembayaran instan via panel admin',
            };
            setTransactions((prevTx) => [newTx, ...prevTx]);
          }
        }
        return { ...s, sppStatus: nextStatus };
      }
      return s;
    }));
    triggerToast(`Status pembayaran SPP ${targetStudent?.name} disinkronkan berkala!`, 'info');
    addSyncLog(`Toggled invoice state to payment verification: ${targetStudent?.name}`);
    trackOfflineChange();
  }, [siswas, transactions, setSiswas, setTransactions, triggerToast, addSyncLog, trackOfflineChange, checkRateLimit, requireRole]);

  const handleRegenerateQr = useCallback(() => {
    if (!requireRole(['ADMIN'], 'regenerasi kode QR')) return;
    const randCode = `QR-CLASS-${Math.floor(1000 + Math.random() * 9000)}`;
    setQrSession({
      sessionId: `SES-${Math.floor(2026 + Math.random() * 100)}`,
      courseName: INITIAL_SCHEDULES[Math.floor(Math.random() * INITIAL_SCHEDULES.length)]?.classTitle ?? 'Matematika',
      code: randCode,
      generatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    });
    triggerToast('Token Sesi QR-Attendance diperbaharui! Suku kurikulum meningkat.', 'success');
    addSyncLog(`Generated unique QR reference session matching ${randCode}`);
  }, [triggerToast, addSyncLog, requireRole]);

  const exportToCSV = useCallback(() => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'ID Siswa,Nama Lengkap,Kelas,Rata-rata Nilai,Persentase Kehadiran,Status SPP,Wali Murid\n';
    siswas.forEach((s) => {
      csvContent += `${sanitizeCSV(s.id)},${sanitizeCSV(s.name)},${sanitizeCSV(s.classLevel)},${s.performanceScore},${sanitizeCSV(`${s.attendanceRate}%`)},${sanitizeCSV(s.sppStatus)},${sanitizeCSV(s.parentName)}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Performa_Bimbel_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Laporan terkompresi CSV berformat standar berhasil diekspor!', 'success');
    addSyncLog('Exported student database performance file to Local CSV format.');
  }, [siswas, triggerToast, addSyncLog]);

  const triggerAutomatedSPPNotification = useCallback(() => {
    if (!requireRole(['ADMIN'], 'mengirim pengingat SPP')) return;
    const belumBayarList = siswas.filter((s) => s.sppStatus === 'BELUM_BAYAR');
    if (belumBayarList.length === 0) {
      triggerToast('Semua siswa saat ini telah membayar SPP bulan ini!', 'info');
      return;
    }
    const newNotifs: Notifikasi[] = belumBayarList.map((siswa, i) => ({
      id: `NT-SPP-${Date.now()}-${i}`,
      title: `Tagihan SPP: ${siswa.name}`,
      message: `Pemberitahuan kepada Wali Murid ${siswa.parentName}, masa tenggang pembayaran SPP Rp ${siswa.sppAmount.toLocaleString('id-ID')} untuk siswa ${siswa.name} akan segera berakhir.`,
      type: 'SPP_INFO' as const,
      timestamp: new Date().toISOString(),
      read: false,
      targetRole: 'WALI_MURID' as const,
    }));
    setNotifs((prev) => [newNotifs[0], ...prev]);
    triggerToast(`Pengingat SPP otomatis terkirim untuk ${belumBayarList.length} wali murid!`, 'success');
    addSyncLog(`Automated push notification sent to ${belumBayarList.length} parents regarding outstanding fees.`);
  }, [siswas, triggerToast, addSyncLog, requireRole]);

  const triggerExamReminderNotification = useCallback(() => {
    if (!requireRole(['ADMIN'], 'mengirim pengingat ujian')) return;
    const newNotif: Notifikasi = {
      id: `NT-EXM-${Date.now()}`,
      title: 'PENGINGAT UJIAN: Evaluasi Tengah Semester',
      message: 'Ujian simulasi UTBK Mandiri dijadwalkan lusa. Mohon seluruh siswa mengunduh lembar latihan di modul belajar kuis interaktif.',
      type: 'UJIAN_INFO',
      timestamp: new Date().toISOString(),
      read: false,
      targetRole: 'ALL',
    };
    setNotifs((prev) => [newNotif, ...prev]);
    triggerToast('Push notifikasi jadwal ujian berhasil disiarkan ke seluruh siswa & pengajar!', 'info');
    addSyncLog('Broadcasted general exam timeline notifications across all node terminals.');
  }, [triggerToast, addSyncLog, requireRole]);

  const handleDownloadMateri = useCallback((id: string) => {
    const mat = materis.find((m) => m.id === id);
    triggerToast(`Memulai proses unduh berkas: ${mat?.title}`, 'success');
    setMateris((prev) => prev.map((m) => m.id === id ? { ...m, downloadsCount: m.downloadsCount + 1 } : m));
  }, [materis, setMateris, triggerToast]);

  const handleCloseQuiz = useCallback(() => {
    setActiveQuizPlay(null);
    setQuizResult(null);
  }, []);

  const value: DataContextValue = {
    siswas, teachers, transactions, schedules, materis, quizzes, notifs,
    setSiswas, setTeachers, setTransactions, setMateris, setNotifs,
    activeTab, setActiveTab, selectedSiswaId, setSelectedSiswaId,
    studentSearch, setStudentSearch, studentClassFilter, setStudentClassFilter,
    materiSearch, setMateriSearch, materiSubjectFilter, setMateriSubjectFilter,
    newSiswaOpen, setNewSiswaOpen, formDataSiswa, setFormDataSiswa,
    newMateriOpen, setNewMateriOpen, formDataMateri, setFormDataMateri,
    activeQuizPlay, quizAnswers, quizResult,
    qrSession, gpsLoading, gpsLocation,
    evalTeacherId, setEvalTeacherId,
    pedagogicalScore, setPedagogicalScore,
    professionalScore, setProfessionalScore,
    socialScore, setSocialScore,
    evalFeedback, setEvalFeedback,
    filteredSiswas, filteredMateris,
    totalSPPExpected, totalSPPCollected, percentSPPCollected,
    performanceTrendData, activeStudentName,
    handleAddSiswa, handleAddMateri,
    handleStartQuiz, handleSelectQuizAnswer, handleSubmitQuiz, handleCloseQuiz,
    toggleSppPaymentStatus, simulateCheckinSiswa, queryBrowserGeolocation,
    handleRegenerateQr, handleSubmitTeacherEvaluation, exportToCSV,
    triggerAutomatedSPPNotification, triggerExamReminderNotification, handleDownloadMateri,
    toast, offlineMode, pendingSyncCount, isSyncing, syncLogs, handleSyncData, toggleOfflineMode,
  };

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}
