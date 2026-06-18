import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect, type ReactNode, type FormEvent } from 'react';
import type { Siswa, Teacher, Transaksi, MateriBelajar, Notifikasi, Schedule, UserRole, InteractiveQuiz } from '../types';
import {
  INITIAL_SISWA, INITIAL_TEACHERS, INITIAL_TRANSACTIONS,
  INITIAL_SCHEDULES, INITIAL_MATERI,
  INITIAL_QUIZZES, INITIAL_NOTIFIKASI,
} from '../data/mockData';
import { usePersistedState } from '../hooks/usePersistedState';
import { validateEmail, sanitizeCSV, GPS_DEFAULT, calculateQuizScore } from '../utils/validation';
import { useToast } from '../hooks/useToast';
import { useSync } from '../hooks/useSync';
import { useAuth } from './AuthContext';
import { StudentsApi, TeachersApi, FinanceApi, MaterialsApi, NotificationsApi, SchedulesApi } from '../api/client';

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

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const loadData = async () => {
      try {
        const [sRes, tRes, fRes, mRes, nRes] = await Promise.all([
          StudentsApi.list({}, controller.signal),
          TeachersApi.list(),
          FinanceApi.transactions(),
          MaterialsApi.list(),
          NotificationsApi.list(),
          SchedulesApi.list(),
        ]);
        if (!controller.signal.aborted) {
          if (sRes.success && sRes.data) setSiswas(sRes.data.data);
          if (tRes.success && tRes.data) setTeachers(tRes.data.data);
          if (fRes.success && fRes.data) setTransactions(fRes.data.data);
          if (mRes.success && mRes.data) setMateris(mRes.data.data);
          if (nRes.success && nRes.data) setNotifs(nRes.data.data);
        }
      } catch {
        // fallback ke localStorage/mockData
      }
    };

    loadData();
    return () => controller.abort();
  }, []);

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
  const handleAddSiswa = useCallback(async (e: FormEvent) => {
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
    const res = await StudentsApi.create({
      name: formDataSiswa.name,
      classLevel: formDataSiswa.classLevel,
      email: formDataSiswa.email,
      parentName: formDataSiswa.parentName,
      parentEmail: formDataSiswa.parentEmail,
      sppAmount: formDataSiswa.sppAmount,
    });
    if (!res.success) {
      triggerToast(res.error || 'Gagal mendaftarkan siswa', 'warn');
      return;
    }
    setSiswas((prev) => [...prev, res.data as Siswa]);
    setNewSiswaOpen(false);
    setFormDataSiswa({ name: '', classLevel: '12 SMA - IPA', email: '', parentName: '', parentEmail: '', sppAmount: 750000 });
    triggerToast(`Siswa ${formDataSiswa.name} sukses didaftarkan!`, 'success');
    addSyncLog(`Registered new student ${formDataSiswa.name} via API.`);
  }, [formDataSiswa, setSiswas, triggerToast, addSyncLog, checkRateLimit, requireRole]);

  const handleAddMateri = useCallback(async (e: FormEvent) => {
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
    const res = await MaterialsApi.create({
      title: formDataMateri.title,
      subject: formDataMateri.subject,
      targetLevel: formDataMateri.targetLevel,
      type: formDataMateri.type,
      isLocked: formDataMateri.isLocked,
    });
    if (!res.success) {
      triggerToast(res.error || 'Gagal mengunggah materi', 'warn');
      return;
    }
    setMateris((prev) => [...prev, res.data as MateriBelajar]);
    setNewMateriOpen(false);
    setFormDataMateri({ title: '', subject: 'Matematika', targetLevel: '12 SMA', type: 'PDF', isLocked: false });
    triggerToast(`Materi "${formDataMateri.title}" berhasil diunggah!`, 'success');
    addSyncLog(`Uploaded new learning topic: "${formDataMateri.title}" via API.`);
  }, [formDataMateri, setMateris, triggerToast, addSyncLog, checkRateLimit, requireRole]);

  const simulateCheckinSiswa = useCallback(async (siswaId: string, checkInMethod: 'QR_SCAN' | 'LOKASI') => {
    if (!checkRateLimit('checkin', 300)) return;
    if (!requireRole(['ADMIN', 'GURU'], 'melakukan presensi')) return;
    const res = await StudentsApi.checkin(siswaId, checkInMethod);
    if (!res.success) {
      triggerToast(res.error || 'Gagal melakukan presensi', 'warn');
      return;
    }
    setSiswas((prev) => prev.map((s) => s.id === siswaId ? (res.data as Siswa) : s));
    triggerToast(`Absensi terdeteksi via ${checkInMethod}!`, 'success');
    addSyncLog(`Student verified attendance using ${checkInMethod}: ${(res.data as Siswa).name}`);
  }, [setSiswas, triggerToast, addSyncLog, checkRateLimit, requireRole]);

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

  const handleSubmitTeacherEvaluation = useCallback(async (e: FormEvent) => {
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
    const res = await TeachersApi.evaluate(evalTeacherId, {
      pedagogical: pedagogicalScore,
      professional: professionalScore,
      social: socialScore,
      feedback: evalFeedback,
    });
    if (!res.success) {
      triggerToast(res.error || 'Gagal menyimpan evaluasi', 'warn');
      return;
    }
    setTeachers((prev) => prev.map((t) => t.id === evalTeacherId ? (res.data as Teacher) : t));
    triggerToast(`Evaluasi pengajar berhasil direkam!`, 'success');
    addSyncLog(`Submitted evaluation for teacher via API.`);
    setEvalFeedback('');
  }, [evalTeacherId, pedagogicalScore, professionalScore, socialScore, evalFeedback, setTeachers, triggerToast, addSyncLog, checkRateLimit, requireRole]);

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

  const toggleSppPaymentStatus = useCallback(async (siswaId: string) => {
    if (!checkRateLimit('toggleSpp')) return;
    if (!requireRole(['ADMIN'], 'mengubah status SPP')) return;
    const targetStudent = siswas.find((s) => s.id === siswaId);
    const res = await StudentsApi.toggleSpp(siswaId);
    if (!res.success) {
      triggerToast(res.error || 'Gagal mengubah status SPP', 'warn');
      return;
    }
    setSiswas((prev) => prev.map((s) => s.id === siswaId ? (res.data as Siswa) : s));
    if ((res.data as Siswa).sppStatus === 'LUNAS') {
      setTransactions((prev) => [{
        id: `TX-${Date.now()}`, amount: (res.data as Siswa).sppAmount,
        type: 'SPP_MASUK', date: new Date().toISOString().split('T')[0],
        payeeName: `${(res.data as Siswa).id} - ${(res.data as Siswa).name}`,
        status: 'LUNAS', notes: 'SPP via panel admin',
      } as Transaksi, ...prev]);
    }
    triggerToast(`Status SPP ${targetStudent?.name} diperbarui!`, 'success');
    addSyncLog(`Toggled SPP status via API: ${targetStudent?.name}`);
  }, [siswas, setSiswas, setTransactions, triggerToast, addSyncLog, checkRateLimit, requireRole]);

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

  const triggerAutomatedSPPNotification = useCallback(async () => {
    if (!requireRole(['ADMIN'], 'mengirim pengingat SPP')) return;
    const res = await NotificationsApi.sppReminder();
    if (!res.success) {
      triggerToast(res.error || 'Gagal mengirim pengingat SPP', 'warn');
      return;
    }
    const notifRes = await NotificationsApi.list();
    if (notifRes.success && notifRes.data) setNotifs(notifRes.data.data);
    triggerToast('Pengingat SPP otomatis terkirim!', 'success');
    addSyncLog('Automated SPP reminder sent via API.');
  }, [setNotifs, triggerToast, addSyncLog, requireRole]);

  const triggerExamReminderNotification = useCallback(async () => {
    if (!requireRole(['ADMIN'], 'mengirim pengingat ujian')) return;
    const res = await NotificationsApi.examReminder();
    if (!res.success) {
      triggerToast(res.error || 'Gagal mengirim pengingat ujian', 'warn');
      return;
    }
    const notifRes = await NotificationsApi.list();
    if (notifRes.success && notifRes.data) setNotifs(notifRes.data.data);
    triggerToast('Pengingat ujian berhasil disiarkan!', 'info');
    addSyncLog('Exam reminder broadcast via API.');
  }, [setNotifs, triggerToast, addSyncLog, requireRole]);

  const handleDownloadMateri = useCallback(async (id: string) => {
    const mat = materis.find((m) => m.id === id);
    if (!mat) return;
    const res = await MaterialsApi.download(id);
    if (!res.success) {
      triggerToast(res.error || 'Gagal mencatat unduhan', 'warn');
      return;
    }
    setMateris((prev) => prev.map((m) => m.id === id ? (res.data as MateriBelajar) : m));
    triggerToast(`Mengunduh: ${mat.title}`, 'success');
    addSyncLog(`Downloaded material: ${mat.title}`);
  }, [materis, setMateris, triggerToast, addSyncLog]);

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
