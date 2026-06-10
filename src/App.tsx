import { useState, useEffect, useCallback, useRef, lazy, Suspense, FormEvent } from 'react';
import { RefreshCw } from 'lucide-react';

import {
  INITIAL_SISWA, INITIAL_TEACHERS, INITIAL_TRANSACTIONS,
  INITIAL_BIAYA_OPERASIONAL, INITIAL_SCHEDULES, INITIAL_MATERI,
  INITIAL_QUIZZES, INITIAL_NOTIFIKASI
} from './data/mockData';
import type { InteractiveQuiz } from './data/mockData';
import type {
  Siswa, Teacher, Transaksi, Schedule, MateriBelajar, Notifikasi, UserRole
} from './types';

import { usePersistedState } from './hooks/usePersistedState';
import Toast from './components/Toast';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatsStrip from './components/StatsStrip';
import ErrorBoundary from './components/ErrorBoundary';

const RingkasanPanel = lazy(() => import('./components/RingkasanPanel'));
const SiswaPanel = lazy(() => import('./components/SiswaPanel'));
const PengajarPanel = lazy(() => import('./components/PengajarPanel'));
const SppPanel = lazy(() => import('./components/SppPanel'));
const ModulPanel = lazy(() => import('./components/ModulPanel'));
const HakAksesPanel = lazy(() => import('./components/HakAksesPanel'));

type ActiveTab = 'ringkasan' | 'siswa' | 'pengajar' | 'spp' | 'modul' | 'hak_akses';

const createId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export default function App() {
  const [siswas, setSiswas] = usePersistedState<Siswa[]>('edu_siswas', INITIAL_SISWA);
  const [teachers, setTeachers] = usePersistedState<Teacher[]>('edu_teachers', INITIAL_TEACHERS);
  const [transactions, setTransactions] = usePersistedState<Transaksi[]>('edu_transactions', INITIAL_TRANSACTIONS);
  const [schedules] = usePersistedState<Schedule[]>('edu_schedules', INITIAL_SCHEDULES);
  const [materis, setMateris] = usePersistedState<MateriBelajar[]>('edu_materis', INITIAL_MATERI);
  const [quizzes] = usePersistedState<InteractiveQuiz[]>('edu_quizzes', INITIAL_QUIZZES);
  const [notifs, setNotifs] = usePersistedState<Notifikasi[]>('edu_notifs', INITIAL_NOTIFIKASI);

  const [activeTab, setActiveTab] = useState<ActiveTab>('ringkasan');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('ADMIN');
  const [offlineMode, setOfflineMode] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warn' | 'info' } | null>(null);
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>(INITIAL_SISWA[0]?.id ?? '');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('Semua');
  const [materiSearch, setMateriSearch] = useState('');
  const [materiSubjectFilter, setMateriSubjectFilter] = useState('Semua');
  const [syncLogs, setSyncLogs] = useState<string[]>([
    'Sistem diinisialisasi pada server node JKT-NODE-01',
    'Sinkronisasi database awan berhasil. Status: Konsisten',
  ]);

  const [newSiswaOpen, setNewSiswaOpen] = useState(false);
  const [formDataSiswa, setFormDataSiswa] = useState({
    name: '', classLevel: '12 SMA - IPA', email: '',
    parentName: '', parentEmail: '', sppAmount: 750000,
  });
  const [newMateriOpen, setNewMateriOpen] = useState(false);
  const [formDataMateri, setFormDataMateri] = useState({
    title: '', subject: 'Matematika', targetLevel: '12 SMA',
    type: 'PDF' as 'PDF' | 'VIDEO' | 'TUGAS', isLocked: false,
  });

  const [activeQuizPlay, setActiveQuizPlay] = useState<InteractiveQuiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; total: number } | null>(null);

  const [qrSession, setQrSession] = useState({
    sessionId: 'SES-2026-991', courseName: 'Matematika Sukses UTBK',
    code: 'QR-ATTEND-MATH-2026', generatedAt: '10:00',
  });

  const [evalTeacherId, setEvalTeacherId] = useState('TCH-001');
  const [pedagogicalScore, setPedagogicalScore] = useState(5);
  const [professionalScore, setProfessionalScore] = useState(4);
  const [socialScore, setSocialScore] = useState(5);
  const [evalFeedback, setEvalFeedback] = useState('');

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lon: number } | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, []);

  const triggerToast = useCallback((message: string, type: 'success' | 'warn' | 'info' = 'success') => {
    setToast({ message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const addSyncLog = useCallback((action: string) => {
    const time = new Date().toLocaleTimeString('id-ID');
    setSyncLogs((prev) => [`[${time}] ${action}`, ...prev.slice(0, 8)]);
  }, []);

  const requireRole = useCallback((allowedRoles: UserRole[], action: string): boolean => {
    if (!allowedRoles.includes(currentUserRole)) {
      triggerToast(`Akses ditolak. Hanya ${allowedRoles.join(' / ')} yang dapat ${action}.`, 'warn');
      return false;
    }
    return true;
  }, [currentUserRole, triggerToast]);

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
  }, [siswas, triggerToast, addSyncLog]);

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
  }, [triggerToast, addSyncLog]);

  const handleSyncData = useCallback(() => {
    setIsSyncing(true);
    triggerToast('Menyambungkan terminal dan mensinkronisasikan revisi offline...', 'info');
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      setIsSyncing(false);
      setPendingSyncCount(0);
      triggerToast('Sinkronisasi real-time berhasil! Semua instansi data wali murid & server terpadu.', 'success');
      addSyncLog('Penyelarasan basis data multi-perangkat dikonsolidasi dengan server JKT-MAIN-NODE.');
    }, 1500);
  }, [triggerToast, addSyncLog]);

  const sanitizeCSV = (val: string) => {
    if (/^[=+\-@]/.test(val)) return `'${val}`;
    if (val.includes('"') || val.includes(',') || val.includes('\n')) return `"${val.replace(/"/g, '""')}"`;
    return val;
  };

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

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAddSiswa = useCallback((e: FormEvent) => {
    e.preventDefault();
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
  }, [formDataSiswa, setSiswas, triggerToast, addSyncLog]);

  const handleAddMateri = useCallback((e: FormEvent) => {
    e.preventDefault();
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
  }, [formDataMateri, currentUserRole, setMateris, triggerToast, addSyncLog]);

  const simulateCheckinSiswa = useCallback((siswaId: string, checkInMethod: 'QR_SCAN' | 'LOKASI') => {
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
          latitude: -6.2088 + (Math.random() - 0.5) * 0.0001,
          longitude: 106.8456 + (Math.random() - 0.5) * 0.0001,
        };
      }
      return student;
    }));
    triggerToast(`Absensi terdeteksi via ${checkInMethod}! Jam: ${timeNow}. Poin performa ${studentName} meningkat (+1.2)!`, 'success');
    addSyncLog(`Student verified attendance using ${checkInMethod}: ${studentName}`);
  }, [setSiswas, triggerToast, addSyncLog]);

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
          setGpsLocation({ lat: -6.2088, lon: 106.8456 });
          setGpsLoading(false);
          triggerToast('Otorisasi GPS dibatasi atau browser offline. Menggunakan koordinat HQ Bimbel Jakarta (+/- 5m).', 'info');
          addSyncLog('Simulated geolocation lock within school vicinity.');
        },
      );
    } else {
      setGpsLocation({ lat: -6.2088, lon: 106.8456 });
      setGpsLoading(false);
      triggerToast('Akses geolokasi tidak didukung oleh browser ini.', 'warn');
    }
  }, [triggerToast, addSyncLog]);

  const handleSubmitTeacherEvaluation = useCallback((e: FormEvent) => {
    e.preventDefault();
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
    const targetTch = teachers.find((t) => t.id === evalTeacherId);
    triggerToast(`Evaluasi pengajar ${targetTch?.name} berhasil direkam ke database!`, 'success');
    addSyncLog(`Submitted regular score review for ${targetTch?.name}. Avg: ${average}/5.0`);
    setEvalFeedback('');
  }, [evalTeacherId, pedagogicalScore, professionalScore, socialScore, evalFeedback, teachers, setTeachers, triggerToast, addSyncLog]);

  const handleStartQuiz = useCallback((quiz: InteractiveQuiz) => {
    setActiveQuizPlay(quiz);
    setQuizAnswers({});
    setQuizResult(null);
  }, []);

  const handleSelectQuizAnswer = useCallback((qId: string, optIndex: number) => {
    setQuizAnswers((prev) => ({ ...prev, [qId]: optIndex }));
  }, []);

  const handleSubmitQuiz = useCallback(() => {
    if (!activeQuizPlay) return;
    if (!selectedSiswaId) {
      triggerToast('Pilih siswa terlebih dahulu di panel Ringkasan!', 'warn');
      return;
    }
    let correctCount = 0;
    activeQuizPlay.questions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) correctCount++;
    });
    const calculatedScore = Math.round((correctCount / activeQuizPlay.questions.length) * 100);
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
  }, [activeQuizPlay, quizAnswers, selectedSiswaId, setSiswas, triggerToast, addSyncLog]);

  const toggleSppPaymentStatus = useCallback((siswaId: string) => {
    if (!requireRole(['ADMIN'], 'mengubah status SPP')) return;
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
    const targetStudent = siswas.find((s) => s.id === siswaId);
    triggerToast(`Status pembayaran SPP ${targetStudent?.name} disinkronkan berkala!`, 'info');
    addSyncLog(`Toggled invoice state to payment verification: ${targetStudent?.name}`);
  }, [siswas, transactions, setSiswas, setTransactions, triggerToast, addSyncLog]);

  const toggleOfflineMode = useCallback(() => {
    setOfflineMode((prev) => {
      if (!prev) {
        triggerToast('Beralih ke MODE OFFLINE. Aktivitas terekam dalam antrean sinkronisasi lokal.', 'warn');
        addSyncLog('Offline standby protocols activated. Using ServiceWorker mock queue.');
      } else {
        triggerToast('Koneksi Internet pulih! Menyinkronkan tumpukan rekam data siswa...', 'success');
        handleSyncData();
      }
      return !prev;
    });
  }, [triggerToast, addSyncLog, handleSyncData]);

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
  }, [triggerToast, addSyncLog]);

  const filteredSiswas = siswas.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.id.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.parentName.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesClass = studentClassFilter === 'Semua' || s.classLevel.includes(studentClassFilter);
    return matchesSearch && matchesClass;
  });

  const filteredMateris = materis.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(materiSearch.toLowerCase()) ||
      m.author.toLowerCase().includes(materiSearch.toLowerCase());
    const matchesSub = materiSubjectFilter === 'Semua' || m.subject.toLowerCase() === materiSubjectFilter.toLowerCase();
    if (currentUserRole === 'SISWA' && m.isLocked) return false;
    return matchesSearch && matchesSub;
  });

  const totalSPPExpected = siswas.reduce((sum, s) => sum + s.sppAmount, 0);
  const totalSPPCollected = siswas.filter((s) => s.sppStatus === 'LUNAS').reduce((sum, s) => sum + s.sppAmount, 0);
  const percentSPPCollected = totalSPPExpected > 0 ? Math.round((totalSPPCollected / totalSPPExpected) * 100) : 0;

  const performanceTrendData = [
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
  ];

  const handleDownloadMateri = useCallback((id: string) => {
    const mat = materis.find((m) => m.id === id);
    triggerToast(`Memulai proses unduh berkas: ${mat?.title}`, 'success');
    setMateris((prev) => prev.map((m) => m.id === id ? { ...m, downloadsCount: m.downloadsCount + 1 } : m));
  }, [materis, setMateris, triggerToast]);

  const handleCloseQuiz = useCallback(() => {
    setActiveQuizPlay(null);
    setQuizResult(null);
  }, []);

  return (
    <ErrorBoundary>
      <div id="edu_admin_root" className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
        {toast && <Toast message={toast.message} type={toast.type} />}

        <Sidebar
          activeTab={activeTab} setActiveTab={setActiveTab}
          currentUserRole={currentUserRole} setCurrentUserRole={(role: UserRole) => {
            setCurrentUserRole(role);
            triggerToast(`Beralih visual akses sebagai user: ${role}`, 'info');
            addSyncLog(`Role changed to simulate user profile access control: ${role}`);
          }}
          offlineMode={offlineMode} toggleOfflineMode={toggleOfflineMode}
          isSyncing={isSyncing} pendingSyncCount={pendingSyncCount} syncLogs={syncLogs}
          siswaCount={siswas.length} materiCount={materis.length} quizCount={quizzes.length}
          onSyncClick={handleSyncData}
        />

        <main id="main_container" className="flex-1 flex flex-col overflow-hidden">
          <Header
            offlineMode={offlineMode} pendingSyncCount={pendingSyncCount}
            onSync={handleSyncData} onSPPReminder={triggerAutomatedSPPNotification}
            onExamReminder={triggerExamReminderNotification} onExportCSV={exportToCSV}
          />

          <div id="workspace_viewport" className="p-4 space-y-4 flex-1 overflow-y-auto flex flex-col bg-slate-50/50">
            <StatsStrip
              siswas={siswas} teachers={teachers}
              totalSPPCollected={totalSPPCollected} percentSPPCollected={percentSPPCollected}
            />

            <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-slate-400 py-20">Memuat panel...</div>}>
              <ErrorBoundary key="ringkasan">
                {activeTab === 'ringkasan' && (
                  <RingkasanPanel
                    siswas={siswas} notifs={notifs} selectedSiswaId={selectedSiswaId}
                    setSelectedSiswaId={setSelectedSiswaId} performanceTrendData={performanceTrendData}
                    onSimulateCheckin={simulateCheckinSiswa} onToggleSpp={toggleSppPaymentStatus}
                    currentUserRole={currentUserRole}
                  />
                )}
              </ErrorBoundary>

              <ErrorBoundary key="siswa">
                {activeTab === 'siswa' && (
                  <SiswaPanel
                    siswas={siswas} filteredSiswas={filteredSiswas} schedules={schedules}
                    selectedSiswaId={selectedSiswaId} setSelectedSiswaId={setSelectedSiswaId}
                    studentSearch={studentSearch} setStudentSearch={setStudentSearch}
                    studentClassFilter={studentClassFilter} setStudentClassFilter={setStudentClassFilter}
                    newSiswaOpen={newSiswaOpen} setNewSiswaOpen={setNewSiswaOpen}
                    formDataSiswa={formDataSiswa} setFormDataSiswa={setFormDataSiswa}
                    onAddSiswa={handleAddSiswa} qrSession={qrSession} onRegenerateQr={handleRegenerateQr}
                    gpsLoading={gpsLoading} gpsLocation={gpsLocation} onGpsQuery={queryBrowserGeolocation}
                    onSimulateCheckin={simulateCheckinSiswa} onToggleSpp={toggleSppPaymentStatus}
                    currentUserRole={currentUserRole}
                  />
                )}
              </ErrorBoundary>

              <ErrorBoundary key="pengajar">
                {activeTab === 'pengajar' && (
                  <PengajarPanel
                    teachers={teachers} schedules={schedules} evalTeacherId={evalTeacherId} setEvalTeacherId={setEvalTeacherId}
                    pedagogicalScore={pedagogicalScore} setPedagogicalScore={setPedagogicalScore}
                    professionalScore={professionalScore} setProfessionalScore={setProfessionalScore}
                    socialScore={socialScore} setSocialScore={setSocialScore}
                    evalFeedback={evalFeedback} setEvalFeedback={setEvalFeedback}
                    onSubmitEvaluation={handleSubmitTeacherEvaluation}
                  />
                )}
              </ErrorBoundary>

              <ErrorBoundary key="spp">
                {activeTab === 'spp' && (
                  <SppPanel siswas={siswas} transactions={transactions} />
                )}
              </ErrorBoundary>

              <ErrorBoundary key="modul">
                {activeTab === 'modul' && (
                  <ModulPanel
                    filteredMateris={filteredMateris} materiSearch={materiSearch}
                    setMateriSearch={setMateriSearch} materiSubjectFilter={materiSubjectFilter}
                    setMateriSubjectFilter={setMateriSubjectFilter}
                    newMateriOpen={newMateriOpen} setNewMateriOpen={setNewMateriOpen}
                    formDataMateri={formDataMateri} setFormDataMateri={setFormDataMateri}
                    onAddMateri={handleAddMateri} onDownload={handleDownloadMateri}
                    quizzes={quizzes} activeQuizPlay={activeQuizPlay}
                    quizAnswers={quizAnswers} quizResult={quizResult}
                    onStartQuiz={handleStartQuiz} onSelectAnswer={handleSelectQuizAnswer}
                    onSubmitQuiz={handleSubmitQuiz} onCloseQuiz={handleCloseQuiz}
                    currentUserRole={currentUserRole}
                  />
                )}
              </ErrorBoundary>

              <ErrorBoundary key="hak_akses">
                {activeTab === 'hak_akses' && <HakAksesPanel />}
              </ErrorBoundary>
            </Suspense>
          </div>

          <footer id="footer_bar" className="h-8 bg-slate-900 border-t border-slate-800 flex items-center px-4 justify-between shrink-0 text-[10px] text-slate-500 font-mono">
            <div>
              STATUS INFRA: <span className="text-emerald-500 font-bold">● OPERATING OPTIMAL</span>
              {' | '}LOKASI: INDONESIA_HQ_GPS_CENTRIC
              {' | '}OFFLINE: <span className={offlineMode ? 'text-amber-500 font-bold' : 'text-slate-500'}>{offlineMode ? 'STANDBY_QUEUE' : 'OFF'}</span>
            </div>
            <div className="hidden sm:inline">© 2026 EDUADMIN BIMBEL • MANAJEMEN TRANSPARAN OPERASIONAL SELESAI</div>
          </footer>
        </main>
      </div>
    </ErrorBoundary>
  );
}