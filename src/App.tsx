import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Calendar,
  DollarSign,
  BookOpen,
  ShieldCheck,
  QrCode,
  MapPin,
  Clock,
  Bell,
  Cpu,
  RefreshCw,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Download,
  CheckCircle,
  AlertTriangle,
  Award,
  FileText,
  Video,
  Layers,
  Sparkles,
  Wifi,
  WifiOff,
  UserCheck,
  Send,
  Trash2,
  Lock,
  ChevronRight,
  HelpCircle,
  Map,
  X,
  Target
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
  BarChart
} from 'recharts';

import { INITIAL_SISWA, INITIAL_TEACHERS, INITIAL_TRANSACTIONS, INITIAL_BIAYA_OPERASIONAL, INITIAL_SCHEDULES, INITIAL_MATERI, INITIAL_QUIZZES, INITIAL_NOTIFIKASI, InteractiveQuiz } from './data/mockData';
import { Siswa, Teacher, Transaksi, BiayaOperasional, Schedule, MateriBelajar, Notifikasi, AbsensiSiswa, UserRole } from './types';

export default function App() {
  // Main state persistence
  const [siswas, setSiswas] = useState<Siswa[]>(() => {
    const saved = localStorage.getItem('edu_siswas');
    return saved ? JSON.parse(saved) : INITIAL_SISWA;
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem('edu_teachers');
    return saved ? JSON.parse(saved) : INITIAL_TEACHERS;
  });

  const [transactions, setTransactions] = useState<Transaksi[]>(() => {
    const saved = localStorage.getItem('edu_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    const saved = localStorage.getItem('edu_schedules');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULES;
  });

  const [materis, setMateris] = useState<MateriBelajar[]>(() => {
    const saved = localStorage.getItem('edu_materis');
    return saved ? JSON.parse(saved) : INITIAL_MATERI;
  });

  const [quizzes, setQuizzes] = useState<InteractiveQuiz[]>(() => {
    const saved = localStorage.getItem('edu_quizzes');
    return saved ? JSON.parse(saved) : INITIAL_QUIZZES;
  });

  const [notifs, setNotifs] = useState<Notifikasi[]>(() => {
    const saved = localStorage.getItem('edu_notifs');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFIKASI;
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'siswa' | 'pengajar' | 'spp' | 'modul' | 'hak_akses'>('ringkasan');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('ADMIN');
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Active toast notification simulation state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warn' | 'info' } | null>(null);

  // Selected entities for deep dive analytics
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>(INITIAL_SISWA[0].id);

  // Filters
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [studentClassFilter, setStudentClassFilter] = useState<string>('Semua');
  const [materiSearch, setMateriSearch] = useState<string>('');
  const [materiSubjectFilter, setMateriSubjectFilter] = useState<string>('Semua');

  // Multi-device sync logs helper
  const [syncLogs, setSyncLogs] = useState<string[]>([
    "Sistem diinisialisasi pada server node JKT-NODE-01",
    "Sinkronisasi database awan berhasil. Status: Konsisten"
  ]);

  // Form states
  const [newSiswaOpen, setNewSiswaOpen] = useState(false);
  const [formDataSiswa, setFormDataSiswa] = useState({
    name: '',
    classLevel: '12 SMA - IPA',
    email: '',
    parentName: '',
    parentEmail: '',
    sppAmount: 750000
  });

  const [newMateriOpen, setNewMateriOpen] = useState(false);
  const [formDataMateri, setFormDataMateri] = useState({
    title: '',
    subject: 'Matematika',
    targetLevel: '12 SMA',
    type: 'PDF' as 'PDF' | 'VIDEO' | 'TUGAS',
    isLocked: false
  });

  // Quiz play state
  const [activeQuizPlay, setActiveQuizPlay] = useState<InteractiveQuiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; total: number } | null>(null);

  // QR Session generator state
  const [qrSession, setQrSession] = useState<{
    sessionId: string;
    courseName: string;
    code: string;
    generatedAt: string;
  }>({
    sessionId: "SES-2026-991",
    courseName: "Matematika Sukses UTBK",
    code: "QR-ATTEND-MATH-2026",
    generatedAt: "10:00"
  });

  // Teacher evaluation form
  const [evalTeacherId, setEvalTeacherId] = useState<string>('TCH-001');
  const [pedagogicalScore, setPedagogicalScore] = useState<number>(5);
  const [professionalScore, setProfessionalScore] = useState<number>(4);
  const [socialScore, setSocialScore] = useState<number>(5);
  const [evalFeedback, setEvalFeedback] = useState<string>('');

  // Location based location tracker helper (mocks GPS coordinates)
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lon: number } | null>(null);

  // Sync state with localstorage
  useEffect(() => {
    localStorage.setItem('edu_siswas', JSON.stringify(siswas));
  }, [siswas]);

  useEffect(() => {
    localStorage.setItem('edu_teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('edu_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('edu_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('edu_materis', JSON.stringify(materis));
  }, [materis]);

  useEffect(() => {
    localStorage.setItem('edu_quizzes', JSON.stringify(quizzes));
  }, [quizzes]);

  useEffect(() => {
    localStorage.setItem('edu_notifs', JSON.stringify(notifs));
  }, [notifs]);

  const triggerToast = (message: string, type: 'success' | 'warn' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Automated notification log appender for simulation of automated reminders
  const triggerAutomatedSPPNotification = () => {
    const belumBayarList = siswas.filter(s => s.sppStatus === 'BELUM_BAYAR');
    if (belumBayarList.length === 0) {
      triggerToast("Semua siswa saat ini telah membayar SPP bulan ini!", "info");
      return;
    }

    const newNotifs: Notifikasi[] = belumBayarList.map((siswa, i) => ({
      id: `NT-SPP-${Date.now()}-${i}`,
      title: `Tagihan SPP: ${siswa.name}`,
      message: `Pemberitahuan kepada Wali Murid ${siswa.parentName}, masa tenggang pembayaran SPP Rp ${siswa.sppAmount.toLocaleString('id-ID')} untuk siswa ${siswa.name} akan segera berakhir. Transparansi penggunaan kas bimbel dapat dipantau di portal operasional.`,
      type: 'SPP_INFO',
      timestamp: new Date().toISOString(),
      read: false,
      targetRole: 'WALI_MURID'
    }));

    setNotifs(prev => [newNotifs[0], ...prev]);
    triggerToast(`Pengingat SPP otomatis terkirim untuk ${belumBayarList.length} wali murid!`, "success");
    addSyncLog(`Automated push notification sent to ${belumBayarList.length} parents regarding outstanding fees.`);
  };

  const triggerExamReminderNotification = () => {
    const newNotif: Notifikasi = {
      id: `NT-EXM-${Date.now()}`,
      title: "PENGINGAT UJIAN: Evaluasi Tengah Semester",
      message: "Ujian simulasi UTBK Mandiri dijadwalkan lusa. Mohon seluruh siswa mengunduh lembar latihan di modul belajar kuis interaktif.",
      type: "UJIAN_INFO",
      timestamp: new Date().toISOString(),
      read: false,
      targetRole: "ALL"
    };

    setNotifs(prev => [newNotif, ...prev]);
    triggerToast("Push notifikasi jadwal ujian berhasil disiarkan ke seluruh siswa & pengajar!", "info");
    addSyncLog("Broadcasted general exam timeline notifications across all node terminals.");
  };

  const addSyncLog = (action: string) => {
    const time = new Date().toLocaleTimeString('id-ID');
    setSyncLogs(prev => [`[${time}] ${action}`, ...prev.slice(0, 8)]);
    if (offlineMode) {
      setPendingSyncCount(c => c + 1);
    }
  };

  // Perform multi-device real-time sync simulation
  const handleSyncData = () => {
    setIsSyncing(true);
    triggerToast("Menyambungkan terminal dan mensinkronisasikan revisi offline...", "info");
    setTimeout(() => {
      setIsSyncing(false);
      setPendingSyncCount(0);
      triggerToast("Sinkronisasi real-time berhasil! Semua instansi data wali murid & server terpadu.", "success");
      addSyncLog("Penyelarasan basis data multi-perangkat dikonsolidasi dengan server JKT-MAIN-NODE.");
    }, 1500);
  };

  // Export Table Data to CSV Formatter
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID Siswa,Nama Lengkap,Kelas,Rata-rata Nilai,Persentase Kehidupan,Status SPP,Wali Murid\n";
    
    siswas.forEach(s => {
      csvContent += `"${s.id}","${s.name}","${s.classLevel}",${s.performanceScore},"${s.attendanceRate}%","${s.sppStatus}","${s.parentName}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Performa_Bimbel_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    triggerToast("Laporan terkompresi CSV berformat standar berhasil diekspor!", "success");
    addSyncLog("Exported student database performance file to Local CSV format.");
  };

  // Handling Student Add
  const handleAddSiswa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDataSiswa.name || !formDataSiswa.email) {
      triggerToast("Nama Lengkap dan Surel Siswa wajib diisi!", "warn");
      return;
    }

    const randomId = `SIS-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newStudent: Siswa = {
      id: randomId,
      name: formDataSiswa.name,
      classLevel: formDataSiswa.classLevel,
      performanceScore: 80.0, // base default score
      attendanceRate: 100.0, // base starter
      email: formDataSiswa.email,
      parentName: formDataSiswa.parentName || "Tidak Diketahui",
      parentEmail: formDataSiswa.parentEmail || "",
      sppStatus: "BELUM_BAYAR",
      sppAmount: formDataSiswa.sppAmount,
      progressHistory: [
        { month: "Apr", score: 80, attendance: 100 },
        { month: "Mei", score: 80, attendance: 100 },
      ],
      subjectsScore: [
        { name: "Matematika", score: 80 },
        { name: "Fisika", score: 80 },
        { name: "Kimia", score: 80 },
        { name: "B. Inggris", score: 80 },
      ],
      qrCodeData: `QR-${formDataSiswa.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString().slice(-4)}`,
      locationCheckedIn: false
    };

    setSiswas(prev => [...prev, newStudent]);
    setNewSiswaOpen(false);
    setFormDataSiswa({
      name: '',
      classLevel: '12 SMA - IPA',
      email: '',
      parentName: '',
      parentEmail: '',
      sppAmount: 750000
    });

    triggerToast(`Siswa ${newStudent.name} sukses didaftarkan!`, "success");
    addSyncLog(`Registered new student ${newStudent.name} with unique QR identifier.`);
  };

  // Add learning material
  const handleAddMateri = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDataMateri.title) {
      triggerToast("Judul materi belajar tidak boleh kosong!", "warn");
      return;
    }

    const newMat: MateriBelajar = {
      id: `MAT-${Math.floor(100 + Math.random() * 900)}`,
      title: formDataMateri.title,
      subject: formDataMateri.subject,
      targetLevel: formDataMateri.targetLevel,
      type: formDataMateri.type,
      url: "#",
      uploadDate: new Date().toISOString().split('T')[0],
      downloadsCount: 0,
      author: currentUserRole === 'ADMIN' ? 'Administrator' : 'Pengajar Terverifikasi',
      isLocked: formDataMateri.isLocked
    };

    setMateris(prev => [...prev, newMat]);
    setNewMateriOpen(false);
    setFormDataMateri({
      title: '',
      subject: 'Matematika',
      targetLevel: '12 SMA',
      type: 'PDF',
      isLocked: false
    });

    triggerToast(`Materi "${newMat.title}" berhasil diunggah dan terindeks!`, "success");
    addSyncLog(`Uploaded new learning topic: "${newMat.title}" locked state: ${newMat.isLocked}`);
  };

  // Simulated QR Code check-in triggers attendance write directly to performance points!
  const simulateCheckinSiswa = (siswaId: string, checkInMethod: 'QR_SCAN' | 'LOKASI') => {
    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    setSiswas(prev => {
      return prev.map(student => {
        if (student.id === siswaId) {
          // Increment performance score (+1.5 points to score as attendance bonus reward)
          const newPerfScore = Math.min(100, Math.round((student.performanceScore + 1.2) * 10) / 10);
          const newAttendRate = Math.min(100, Math.round((student.attendanceRate + 2.5) * 10) / 10);

          return {
            ...student,
            locationCheckedIn: true,
            checkInTime: timeNow,
            performanceScore: newPerfScore,
            attendanceRate: newAttendRate,
            // Mock Location inside radius
            latitude: -6.2088 + (Math.random() - 0.5) * 0.0001,
            longitude: 106.8456 + (Math.random() - 0.5) * 0.0001,
          };
        }
        return student;
      });
    });

    const targetStudent = siswas.find(s => s.id === siswaId);
    const studentName = targetStudent ? targetStudent.name : "Siswa";

    // Insert transaction / log item automatically if payment related or notify
    triggerToast(`Absensi terdeteksi via ${checkInMethod}! Jam: ${timeNow}. Poin performa ${studentName} meningkat (+1.2)!`, "success");
    addSyncLog(`Student verified attendance using ${checkInMethod}: ${studentName}`);
  };

  // Run mock geolocation check (Using accurate browser tracking or mock default coordinates)
  const queryBrowserGeolocation = () => {
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setGpsLocation({ lat, lon });
          setGpsLoading(false);
          triggerToast(`Satelit GPS sinkron! Koordinat Anda: ${lat.toFixed(5)}, ${lon.toFixed(5)}`, "success");
          addSyncLog(`Retrieved real geolocalization coordinates from client: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        },
        (error) => {
          // fall back to Jakarta HQ with slight variance
          setGpsLocation({ lat: -6.2088, lon: 106.8456 });
          setGpsLoading(false);
          triggerToast("Otorisasi GPS dibatasi atau browser offline. Menggunakan koordinat HQ Bimbel Jakarta (+/- 5m).", "info");
          addSyncLog("Simulated geolocation lock within school vicinity.");
        }
      );
    } else {
      setGpsLocation({ lat: -6.2088, lon: 106.8456 });
      setGpsLoading(false);
      triggerToast("Akses geolokasi tidak didukung oleh browser ini.", "warn");
    }
  };

  // Submit guru evaluation
  const handleSubmitTeacherEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    const average = Math.round(((pedagogicalScore + professionalScore + socialScore) / 3) * 10) / 10;
    
    setTeachers(prev => {
      return prev.map(t => {
        if (t.id === evalTeacherId) {
          const newEval = {
            id: `EV-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            reviewer: "Admin Utama (Sesi Evaluasi Berkala)",
            pedagogical: pedagogicalScore,
            professional: professionalScore,
            social: socialScore,
            feedback: evalFeedback || "Performa mengajar yang dipertahankan dengan evaluasi berkala."
          };
          
          const newEvaluations = [newEval, ...t.evaluations];
          // Recalculate total rating score in average form (4.0 - 5.0)
          const newOverallRating = Math.round((newEvaluations.reduce((acc, ev) => acc + (ev.pedagogical + ev.professional + ev.social)/3, 0) / newEvaluations.length) * 10) / 10;
          const calculatedEvaluationPerformance = Math.min(100, Math.round((newOverallRating / 5) * 100));

          return {
            ...t,
            rating: newOverallRating,
            evaluationScore: calculatedEvaluationPerformance,
            evaluations: newEvaluations
          };
        }
        return t;
      });
    });

    const targetTch = teachers.find(t => t.id === evalTeacherId);
    triggerToast(`Evaluasi pengajar ${targetTch?.name} berhasil direkam ke database!`, "success");
    addSyncLog(`Submitted regular score review for ${targetTch?.name}. Avg: ${average}/5.0`);
    setEvalFeedback('');
  };

  // Quiz play helper
  const handleStartQuiz = (quiz: InteractiveQuiz) => {
    setActiveQuizPlay(quiz);
    setQuizAnswers({});
    setQuizResult(null);
  };

  const handleSelectQuizAnswer = (qId: string, optIndex: number) => {
    setQuizAnswers(prev => ({ ...prev, [qId]: optIndex }));
  };

  const handleSubmitQuiz = () => {
    if (!activeQuizPlay) return;
    let correctCount = 0;
    activeQuizPlay.questions.forEach(q => {
      if (quizAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    const calculatedScore = Math.round((correctCount / activeQuizPlay.questions.length) * 100);
    setQuizResult({ score: calculatedScore, total: activeQuizPlay.questions.length });
    
    // Add score to selected student to simulate dynamic performance update
    setSiswas(prev => {
      return prev.map(s => {
        if (s.id === selectedSiswaId) {
          // update matching subject score
          const updatedSubjects = s.subjectsScore.map(sub => {
            if (sub.name.toLowerCase() === activeQuizPlay.subject.toLowerCase() || (sub.name === "Matematika" && activeQuizPlay.subject === "Matematika")) {
              return { ...sub, score: Math.round((sub.score + calculatedScore) / 2) };
            }
            return sub;
          });

          // new overall performance score recalculation
          const newPerfScore = Math.round((updatedSubjects.reduce((acc, curr) => acc + curr.score, 0) / updatedSubjects.length) * 10) / 10;

          return {
            ...s,
            subjectsScore: updatedSubjects,
            performanceScore: newPerfScore
          };
        }
        return s;
      });
    });

    triggerToast(`Kuis selesai! Nilai Siswa: ${calculatedScore}. Performa siswa di-update real-time.`, "success");
    addSyncLog(`Student submitted interactive quiz test score ${calculatedScore}% for subject ${activeQuizPlay.subject}`);
  };

  // Simulated SPP payment toggle from tables
  const toggleSppPaymentStatus = (siswaId: string) => {
    setSiswas(prev => {
      return prev.map(s => {
        if (s.id === siswaId) {
          const nextStatus = s.sppStatus === 'LUNAS' ? 'BELUM_BAYAR' : 'LUNAS';
          
          // Emit a simulated transactional logging if changed to lunas
          if (nextStatus === 'LUNAS') {
            const newTx: Transaksi = {
              id: `TX-2026-${Math.floor(100 + Math.random() * 900)}`,
              amount: s.sppAmount,
              type: 'SPP_MASUK',
              date: new Date().toISOString().split('T')[0],
              payeeName: `${s.name} (Wali ${s.parentName})`,
              status: 'LUNAS',
              notes: `SPP pembayaran instan via panel admin`
            };
            setTransactions(prevTx => [newTx, ...prevTx]);
          }

          return {
            ...s,
            sppStatus: nextStatus
          };
        }
        return s;
      });
    });

    const targetStudent = siswas.find(s => s.id === siswaId);
    triggerToast(`Status pembayaran SPP ${targetStudent?.name} disinkronkan berkala!`, "info");
    addSyncLog(`Toggled invoice state to payment verification: ${targetStudent?.name}`);
  };

  // Offline Mode Standby handler
  const toggleOfflineMode = () => {
    setOfflineMode(!offlineMode);
    if (!offlineMode) {
      triggerToast("Beralih ke MODE OFFLINE. Aktivitas terekam dalam antrean sinkronisasi lokal.", "warn");
      addSyncLog("Offline standby protocols activated. Using ServiceWorker mock queue.");
    } else {
      triggerToast("Koneksi Internet pulih! Menyinkronkan tumpukan rekam data siswa...", "success");
      handleSyncData();
    }
  };

  // Filtered Siswa List helper
  const filteredSiswas = siswas.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                          s.id.toLowerCase().includes(studentSearch.toLowerCase()) ||
                          s.parentName.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesClass = studentClassFilter === 'Semua' || s.classLevel.includes(studentClassFilter);
    return matchesSearch && matchesClass;
  });

  // Filtered learning materials
  const filteredMateris = materis.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(materiSearch.toLowerCase()) || 
                          m.author.toLowerCase().includes(materiSearch.toLowerCase());
    const matchesSub = materiSubjectFilter === 'Semua' || m.subject.toLowerCase() === materiSubjectFilter.toLowerCase();
    
    // Strict Access Control role filtering: Standard students shouldn't search locked materials easily
    if (currentUserRole === 'SISWA' && m.isLocked) {
      return false; // locked is hidden or disabled for standard children view
    }
    return matchesSearch && matchesSub;
  });

  // Select Student for Deep Dive
  const selectedSiswaObj = siswas.find(s => s.id === selectedSiswaId) || siswas[0];

  // Financial summary formulas
  const totalSPPExpected = siswas.length * 750000;
  const totalSPPCollected = siswas.filter(s => s.sppStatus === 'LUNAS').reduce((sum, s) => sum + s.sppAmount, 0);
  const percentSPPCollected = Math.round((totalSPPCollected / totalSPPExpected) * 100);

  // Total operational cost
  const totalOperationalCost = INITIAL_BIAYA_OPERASIONAL.reduce((sum, item) => sum + item.totalCost, 0);
  const costPerSiswaCalculated = INITIAL_BIAYA_OPERASIONAL.reduce((sum, b) => sum + b.siswaShare, 0);

  // Recharts combo data
  const performanceTrendData = [
    { name: 'Jan', RataNilai: 79, Kehadiran: 85, SPP_Pemasukan: 12000000 },
    { name: 'Feb', RataNilai: 82, Kehadiran: 90, SPP_Pemasukan: 15400000 },
    { name: 'Mar', RataNilai: 85, Kehadiran: 92, SPP_Pemasukan: 18900000 },
    { name: 'Apr', RataNilai: 86.4, Kehadiran: 94, SPP_Pemasukan: 21000000 },
    { name: 'Mei', RataNilai: 88.2, Kehadiran: 96, SPP_Pemasukan: 24500000 },
    { name: 'Juni (Real)', RataNilai: Math.round((siswas.reduce((acc, s) => acc + s.performanceScore, 0) / siswas.length) * 10) / 10, Kehadiran: Math.round((siswas.reduce((acc, s) => acc + s.attendanceRate, 0) / siswas.length) * 10) / 10, SPP_Pemasukan: totalSPPCollected },
  ];

  return (
    <div id="edu_admin_root" className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* Visual Toast Notification Banner */}
      {toast && (
        <div 
          id="toast_banner"
          className={`absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold tracking-wide transition-all border animate-bounce ${
            toast.type === 'success' ? 'bg-emerald-500 text-white border-emerald-600' :
            toast.type === 'warn' ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-white" />}
          {toast.type === 'warn' && <AlertTriangle className="w-4 h-4 text-white" />}
          {toast.type === 'info' && <Sparkles className="w-4 h-4 text-blue-400 font-bold" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* --- SIDEBAR ASIDE --- STYLE: HIGH DENSITY RICH DARK */}
      <aside id="sidebar" className="w-56 bg-slate-900 flex flex-col shrink-0 text-slate-300 border-r border-slate-800">
        <div id="sidebar_header" className="p-4 border-b border-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white relative shadow-sm">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white leading-tight">EduAdmin Bimbel</span>
            <span className="text-[10px] opacity-60">Admin Les Khusus v2.6</span>
          </div>
        </div>

        {/* Access Control Role Selector Section */}
        <div id="role_control_panel" className="px-3 pt-3 pb-2 bg-slate-950/60 border-b border-slate-800/80">
          <div className="text-[9px] font-semibold text-slate-400 uppercase px-2 mb-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Kontrol Peran Aktif</span>
          </div>
          <select 
            id="role_selector"
            value={currentUserRole}
            onChange={(e) => {
              const roleSelected = e.target.value as UserRole;
              setCurrentUserRole(roleSelected);
              triggerToast(`Beralih visual akses sebagai user: ${roleSelected}`, 'info');
              addSyncLog(`Role changed to simulate user profile access control: ${roleSelected}`);
            }}
            className="w-full text-[11px] px-2 py-1 bg-slate-800 text-white border border-slate-700 rounded font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ADMIN">ADMINISTRATOR (Full)</option>
            <option value="GURU">GURU / TUTOR (Akses Presensi & Materi)</option>
            <option value="WALI_MURID">WALI MURID (Keuangan & Rapor Personal)</option>
            <option value="SISWA">SISWA (Kuis, Lokasi & Modul Belajar)</option>
          </select>
          <div className="mt-1 px-2 text-[9px] text-slate-500 font-mono flex items-center justify-between">
            <span>Status:</span>
            <span className="text-emerald-400 font-bold tracking-wider">SECURE_SSL</span>
          </div>
        </div>

        <nav id="sidebar_nav" className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          <div className="text-[9px] font-semibold text-slate-500 uppercase px-2 mb-1 tracking-wider">Dashboard Utama</div>
          
          <button 
            id="nav_ringkasan"
            onClick={() => setActiveTab('ringkasan')}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[11px] font-medium transition-colors ${
              activeTab === 'ringkasan' 
                ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-600 font-bold' 
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5" />
              <span>Ringkasan Performa</span>
            </div>
            {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />}
          </button>

          <button 
            id="nav_siswa"
            onClick={() => setActiveTab('siswa')}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[11px] font-medium transition-colors ${
              activeTab === 'siswa' 
                ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-600 font-bold' 
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              <span>Siswa & QR Presensi</span>
            </div>
            <span className="bg-blue-900/60 text-blue-300 px-1 py-[1px] text-[8px] rounded font-mono font-bold">
              {siswas.length}
            </span>
          </button>

          <button 
            id="nav_pengajar"
            onClick={() => setActiveTab('pengajar')}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[11px] font-medium transition-colors ${
              activeTab === 'pengajar' 
                ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-600 font-bold' 
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Jadwal & Evaluasi Guru</span>
            </div>
          </button>

          <div className="pt-3 text-[9px] font-semibold text-slate-500 uppercase px-2 mb-1 tracking-wider">Keuangan & Materi</div>

          <button 
            id="nav_spp"
            onClick={() => setActiveTab('spp')}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[11px] font-medium transition-colors ${
              activeTab === 'spp' 
                ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-600 font-bold' 
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Laporan SPP & Beban</span>
            </div>
            {percentSPPCollected < 100 && (
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
            )}
          </button>

          <button 
            id="nav_modul"
            onClick={() => setActiveTab('modul')}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[11px] font-medium transition-colors ${
              activeTab === 'modul' 
                ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-600 font-bold' 
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Modul Belajar & Kuis</span>
            </div>
            <span className="bg-emerald-950 text-emerald-400 px-1 py-[1px] text-[8px] rounded font-bold">
              {materis.length + quizzes.length}
            </span>
          </button>

          <div className="pt-3 text-[9px] font-semibold text-slate-500 uppercase px-2 mb-1 tracking-wider">Infrastruktur Integrasi</div>

          <button 
            id="nav_sync"
            onClick={toggleOfflineMode}
            className={`w-full flex items-center justify-between px-2 py-1.2 rounded text-[10px] text-slate-400 font-mono transition-colors hover:bg-slate-800`}
          >
            <div className="flex items-center gap-1.5">
              {offlineMode ? <WifiOff className="w-3 h-3 text-red-400" /> : <Wifi className="w-3 h-3 text-emerald-400" />}
              <span>Mode Offline</span>
            </div>
            <span className={`text-[9px] ${offlineMode ? 'text-amber-400' : 'text-emerald-400'}`}>
              {offlineMode ? 'STANDBY' : 'AKTIF'}
            </span>
          </button>
        </nav>

        {/* Sync Status Logger Footer */}
        <div id="sync_history_list" className="p-3 bg-slate-950/80 border-t border-slate-800/80 text-[9px] font-mono">
          <div className="flex items-center justify-between text-slate-400 mb-1 font-bold">
            <span>Terminal Live Logs:</span>
            {pendingSyncCount > 0 && (
              <span className="text-amber-400 animate-pulse font-bold">+{pendingSyncCount} offline changes</span>
            )}
          </div>
          <div className="h-20 overflow-y-auto space-y-1 text-slate-500">
            {syncLogs.map((log, index) => (
              <div key={index} className="line-clamp-2 leading-normal break-all">{log}</div>
            ))}
          </div>
        </div>

        {/* Bottom profile matching the theme layout */}
        <div id="user_profile_box" className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs uppercase shadow-sm">
            {currentUserRole[0]}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[11px] font-semibold text-white truncate">Felix Simatupang</span>
            <span className="text-[9px] text-slate-400 font-mono truncate">{currentUserRole} - Bimbel HQ</span>
          </div>
        </div>
      </aside>

      {/* --- MAIN STAGE CONTAINER --- */}
      <main id="main_container" className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER BAR */}
        <header id="header_pane" className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Real-time Indicator banner */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-[11px] font-medium">
              <span className={`w-2 h-2 rounded-full ${offlineMode ? 'bg-red-400 animate-pulse' : 'bg-emerald-500 animate-ping'}`}></span>
              <span className="text-slate-600 font-semibold uppercase">
                {offlineMode ? 'Offline Standby (Local Queue)' : 'Real-time Cloud Sync Active'}
              </span>
            </div>

            <div className="h-4 w-px bg-slate-200"></div>
            
            <div className="hidden lg:flex items-center gap-1 text-[10px] text-slate-400 font-mono">
              Server: <span className="text-slate-600 bg-slate-100 rounded px-1.5 py-0.5">JKT-NODE-01</span>
            </div>

            {pendingSyncCount > 0 && (
              <button 
                id="btn_sync_now"
                onClick={handleSyncData}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-mono px-2 py-0.5 rounded animate-pulse"
              >
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                <span>Sinkronisasi Sekarang ({pendingSyncCount})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Automated Broadcast reminders triggers */}
            <div className="flex items-center gap-1.5 border border-slate-200 rounded p-0.5 bg-slate-50">
              <button 
                id="btn_noti_spp"
                onClick={triggerAutomatedSPPNotification}
                title="Kirim pengingat SPP otomatis ke orang tua murid yang belum lunas"
                className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 rounded text-[10px] font-semibold flex items-center gap-1 transition shadow-sm"
              >
                <DollarSign className="w-3 h-3 text-amber-500" />
                <span className="hidden sm:inline">Picu Pengingat SPP</span>
              </button>
              
              <button 
                id="btn_noti_exam"
                onClick={triggerExamReminderNotification}
                title="Siarkan pengingat ujian try-out ke seluruh siswa"
                className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-600 border border-slate-200 rounded text-[10px] font-semibold flex items-center gap-1 transition shadow-sm"
              >
                <Bell className="w-3 h-3 text-emerald-500" />
                <span className="hidden sm:inline">Pengingat Ujian</span>
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200"></div>

            {/* CSV Exporter Action */}
            <button 
              id="btn_export_csv"
              onClick={exportToCSV}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <div id="workspace_viewport" className="p-4 space-y-4 flex-1 overflow-y-auto flex flex-col bg-slate-50/50">
          
          {/* STATS STRIP ROW */}
          <div id="stats_strip" className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Siswa Aktif</span>
                <span className="text-xl font-bold font-mono text-slate-800 tracking-tight block mt-0.5">{siswas.length}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-emerald-600 font-semibold mt-1">
                <span>+12% Bulan ini</span>
                <Users className="w-3.5 h-3.5 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pendapatan SPP (Juni)</span>
                <span className="text-xl font-bold font-mono text-slate-800 tracking-tight block mt-0.5">
                  Rp {totalSPPCollected.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                <span className="font-bold text-blue-600">{percentSPPCollected}% Terbayar</span>
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Kehadiran (QR & GPS)</span>
                <span className="text-xl font-bold font-mono text-slate-800 tracking-tight block mt-0.5">
                  {Math.round((siswas.filter(s => s.locationCheckedIn).length / siswas.length) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span className="text-emerald-500 font-bold">Auto-Sync</span>
                <QrCode className="w-3.5 h-3.5 text-purple-500" />
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Avg Evaluasi Guru</span>
                <span className="text-xl font-bold font-mono text-slate-800 tracking-tight block mt-0.5">
                  {(teachers.reduce((acc, t) => acc + t.rating, 0) / teachers.length).toFixed(1)}/5.0
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-blue-600 font-semibold mt-1">
                <span>Operasional Efisien</span>
                <Award className="w-3.5 h-3.5 text-amber-500 font-mono" />
              </div>
            </div>
          </div>

          {/* TAB 1: RINGKASAN PERFORMANCE ANALYTICS PANEL */}
          {activeTab === 'ringkasan' && (
            <div id="panel_ringkasan" className="space-y-4 flex flex-col flex-1">
              
              {/* PRIMARY VISUALIZATION GRAPH BLOCK */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Visualisasi Analitik Komparatif Real-Time</h3>
                      <p className="text-[10px] text-slate-400">Hubungan kemajuan performa nilai rata-rata siswa dan tren rekonsiliasi SPP bulanan</p>
                    </div>
                    <div className="flex gap-2 bg-slate-50 border border-slate-200 p-1 rounded font-mono text-[9px]">
                      <span className="flex items-center gap-1 text-slate-600">
                        <span className="w-2.5 h-2 my-auto bg-blue-500 rounded-sm"></span> Rata-Rata Nilai
                      </span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <span className="w-2.5 h-2 my-auto bg-emerald-500 rounded-sm"></span> SPP Terbayar (IDR)
                      </span>
                    </div>
                  </div>

                  <div className="h-56 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={performanceTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                        <YAxis yAxisId="left" stroke="#3b82f6" fontSize={9} />
                        <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={9} />
                        <Tooltip contentStyle={{ fontSize: '10px', backgroundColor: '#fff', borderRadius: '6px' }} />
                        <Area yAxisId="right" type="monotone" dataKey="SPP_Pemasukan" fill="#e6f4ea" stroke="#10b981" strokeWidth={2} name="SPP (Rp)" />
                        <Bar yAxisId="left" dataKey="RataNilai" barSize={25} fill="#3b82f6" radius={[2, 2, 0, 0]} name="Rata-rata Nilai" />
                        <Line yAxisId="left" type="monotone" dataKey="Kehadiran" stroke="#f59e0b" strokeWidth={2} name="Persentase Keberhasilan (%)" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* REALTIME SPP TIMELINE ALERTS & SYSTEM STATUS */}
                <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                      <span>Log Trigger Push Notifikasi</span>
                      <span className="bg-amber-100 text-amber-700 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded">Siswa & Wali</span>
                    </h3>
                    
                    <div className="space-y-2 overflow-y-auto max-h-52 pr-1">
                      {notifs.map(n => (
                        <div 
                          key={n.id} 
                          className={`p-2 rounded border text-[11px] transition-colors ${
                            n.type === 'SPP_INFO' ? 'bg-amber-50/60 border-amber-100 text-slate-800' :
                            n.type === 'UJIAN_INFO' ? 'bg-red-50/60 border-red-100 text-slate-800' :
                            'bg-blue-50/60 border-blue-100 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-slate-900 mb-0.5">
                            <span className="truncate">{n.title}</span>
                            <span className="text-[8px] text-slate-400 font-mono">{new Date(n.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-[10px] text-slate-600 leading-normal line-clamp-2">{n.message}</p>
                          <div className="flex items-center gap-2 mt-1 text-[8px] text-slate-400">
                            <span className="bg-slate-200 text-slate-800 px-1 rounded uppercase font-bold">{n.targetRole}</span>
                            <span>•</span>
                            <span>Instat Push Sent</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 mt-2 text-[10px] text-slate-500 font-semibold space-y-1 bg-slate-50 p-2 rounded">
                    <div className="flex justify-between">
                      <span>Status Push Server:</span>
                      <span className="text-emerald-600 font-mono">ONLINE_DISPATCH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wali Murid Online:</span>
                      <span className="text-blue-600 font-mono">{siswas.filter(s=>s.locationCheckedIn).length} Parent Connected</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* STUDENT PERSONAL PROGRESS DEEP DIVE BENTO SECTION */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Dasbor Analitik Perkembangan Siswa Secara Mendalam & Personal</span>
                    </h3>
                    <p className="text-[10px] text-slate-400">Pilih nama siswa di bawah untuk mendiagnosis rapor kehadiran, nilai, serta grafik bulanan privat.</p>
                  </div>

                  {/* Dropdown to switch student profile dynamic */}
                  <div className="mt-2 sm:mt-0">
                    <select 
                      id="siswa_deep_dive_selector"
                      value={selectedSiswaId}
                      onChange={(e) => setSelectedSiswaId(e.target.value)}
                      className="text-xs px-2 py-1.5 border border-slate-200 rounded bg-white text-slate-700 font-semibold focus:ring-1 focus:ring-blue-500"
                    >
                      {siswas.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.classLevel})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4">
                  {/* Deep dive details */}
                  <div className="col-span-12 md:col-span-4 bg-slate-50 rounded-lg p-3 border border-slate-105">
                    <div className="flex items-center gap-3 mb-3">
                      <img 
                        src={selectedSiswaObj.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                        alt="Avatar" 
                        className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm bg-blue-100"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{selectedSiswaObj.name}</h4>
                        <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded uppercase block mt-0.5">{selectedSiswaObj.classLevel}</span>
                        <span className="text-[9px] text-slate-500 block font-mono mt-0.5">{selectedSiswaObj.email}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-[10px] text-slate-600 border-t border-slate-200/60 pt-2.5">
                      <div className="flex justify-between">
                        <span>Kontak Orang Tua:</span>
                        <span className="font-bold text-slate-800">{selectedSiswaObj.parentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Email Orang Tua:</span>
                        <span className="font-mono text-slate-500 block truncate max-w-[130px]">{selectedSiswaObj.parentEmail}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Biaya SPP Sekolah:</span>
                        <span className="font-bold text-slate-800">Rp {selectedSiswaObj.sppAmount.toLocaleString('id-ID')}/bln</span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-1.5 rounded border border-slate-200">
                        <span>Status Invoice SPP:</span>
                        <button 
                          id={`spp_toggle_${selectedSiswaObj.id}`}
                          onClick={() => toggleSppPaymentStatus(selectedSiswaObj.id)}
                          title="Klik untuk mengubah status tagihan langsung"
                          className={`px-2 py-0.5 rounded text-[9px] font-bold transition ${
                            selectedSiswaObj.sppStatus === 'LUNAS' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-red-100 text-red-800 hover:bg-slate-200'
                          }`}
                        >
                          {selectedSiswaObj.sppStatus === 'LUNAS' ? '● TERBAYAR (LUNAS)' : '⚠️ BELUM BAYAR (BAYAR)'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quantitative Marks Breakdown */}
                  <div className="col-span-12 md:col-span-4 bg-slate-50 rounded-lg p-3 border border-slate-105">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Evaluasi Penilaian Mata Pelajaran Akademik</h4>
                    
                    <div className="space-y-2">
                      {selectedSiswaObj.subjectsScore.map((sub, idx) => (
                        <div key={idx} className="bg-white p-2 rounded border border-slate-100">
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="font-semibold text-slate-700">{sub.name}</span>
                            <span className="font-mono font-bold text-blue-600">{sub.score} / 100</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                sub.score >= 90 ? 'bg-emerald-500' :
                                sub.score >= 80 ? 'bg-blue-500' :
                                sub.score >= 70 ? 'bg-amber-500' : 'bg-red-500'
                              }`} 
                              style={{ width: `${sub.score}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Attendance & QR metadata metrics */}
                  <div className="col-span-12 md:col-span-4 bg-slate-50 rounded-lg p-3 border border-slate-105 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Integrasi GPS & Scan Attendance Terpaut</h4>
                      
                      <div className="space-y-1.5 text-[11px] text-slate-600">
                        <div className="bg-white p-2 rounded border border-slate-150 flex items-center justify-between">
                          <span className="flex items-center gap-1 text-slate-600">
                            <QrCode className="w-3.5 h-3.5 text-purple-600" />
                            <span>Batas Check-in Harian:</span>
                          </span>
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1 rounded">08:00 AM WIB</span>
                        </div>

                        <div className="bg-white p-2 rounded border border-slate-150">
                          <div className="flex items-center justify-between mb-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-red-500" />
                              <span>Log Absensi Lokasi:</span>
                            </span>
                            <span className={`text-[10px] font-bold ${selectedSiswaObj.locationCheckedIn ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {selectedSiswaObj.locationCheckedIn ? 'HADIR (RADIUS)' : 'ABSEN / PENDING'}
                            </span>
                          </div>
                          {selectedSiswaObj.locationCheckedIn ? (
                            <div className="text-[9px] text-slate-500 font-mono border-t border-slate-100 pt-1 mt-1">
                              <div>Jam Masuk: {selectedSiswaObj.checkInTime || '07:44'}</div>
                              <div>Koordinat: {selectedSiswaObj.latitude?.toFixed(4)}, {selectedSiswaObj.longitude?.toFixed(4)}</div>
                              <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded inline-block mt-1">Valid dalam radius 15m (Bimbel HQ)</span>
                            </div>
                          ) : (
                            <div className="text-[9px] text-slate-400 font-mono mt-1">
                              Gagal melacak dalam koordinat HQ. Silakan presensi menggunakan scan berkas QR atau verifikasi manual oleh Guru.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button 
                        id={`btn_simulate_attend_ringkasan_${selectedSiswaObj.id}`}
                        onClick={() => simulateCheckinSiswa(selectedSiswaObj.id, 'QR_SCAN')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1 px-2 rounded flex items-center justify-center gap-1 shadow transition"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Simulasi Kehadiran Masuk ({selectedSiswaObj.name})</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SISWA & QR ATTENDANCE SCANNER PANEL */}
          {activeTab === 'siswa' && (
            <div id="panel_siswa" className="space-y-4 flex flex-col flex-1">
              
              {/* COMPACT INTUITIVE SEARCH BAR */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                    <input 
                      id="search_siswa_input"
                      type="text"
                      placeholder="Cari Budi, Siti, Rina atau ID..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-8 pr-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-500 text-slate-700"
                    />
                  </div>

                  <select 
                    id="filter_siswa_level"
                    value={studentClassFilter}
                    onChange={(e) => setStudentClassFilter(e.target.value)}
                    className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                  >
                    <option value="Semua">Semua Jenjang Kelas</option>
                    <option value="12 SMA">12 SMA</option>
                    <option value="11 SMA">11 SMA</option>
                    <option value="10 SMA">10 SMA</option>
                  </select>
                </div>

                <div className="flex gap-2 w-full md:w-auto justify-end">
                  <button 
                    id="btn_open_student_modal"
                    onClick={() => setNewSiswaOpen(!newSiswaOpen)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Daftarkan Siswa Baru</span>
                  </button>
                </div>
              </div>

              {/* SISWA REGISTER DIALOG / POPUP INLINE FORM */}
              {newSiswaOpen && (
                <form id="student_register_form" onSubmit={handleAddSiswa} className="bg-slate-900 text-white border border-slate-800 rounded-lg p-4 animate-fadeIn space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                      <UserCheck className="w-4 h-4" />
                      <span>Form Pendaftaran Siswa & Sinkronisasi Wali Murid</span>
                    </h3>
                    <button type="button" onClick={() => setNewSiswaOpen(false)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Nama Siswa Lengkap *</label>
                      <input 
                        id="form_siswa_name"
                        type="text"
                        required
                        placeholder="Contoh: Raden Sutan"
                        value={formDataSiswa.name}
                        onChange={(e) => setFormDataSiswa({...formDataSiswa, name: e.target.value})}
                        className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Jenjang & Jurusan *</label>
                      <select 
                        id="form_siswa_class"
                        value={formDataSiswa.classLevel}
                        onChange={(e) => setFormDataSiswa({...formDataSiswa, classLevel: e.target.value})}
                        className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white"
                      >
                        <option value="12 SMA - IPA">12 SMA - IPA</option>
                        <option value="12 SMA - IPS">12 SMA - IPS</option>
                        <option value="11 SMA - IPA">11 SMA - IPA</option>
                        <option value="11 SMA - IPS">11 SMA - IPS</option>
                        <option value="10 SMA">10 SMA</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Surel Aktif (Siswa) *</label>
                      <input 
                        id="form_siswa_email"
                        type="email"
                        required
                        placeholder="raden@siswa.edu"
                        value={formDataSiswa.email}
                        onChange={(e) => setFormDataSiswa({...formDataSiswa, email: e.target.value})}
                        className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Nama Wali Murid *</label>
                      <input 
                        id="form_siswa_parent_name"
                        type="text"
                        placeholder="Nama Bapak/Ibu"
                        value={formDataSiswa.parentName}
                        onChange={(e) => setFormDataSiswa({...formDataSiswa, parentName: e.target.value})}
                        className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Surel Wali Murid *</label>
                      <input 
                        id="form_siswa_parent_email"
                        type="email"
                        placeholder="bapak@parent.com"
                        value={formDataSiswa.parentEmail}
                        onChange={(e) => setFormDataSiswa({...formDataSiswa, parentEmail: e.target.value})}
                        className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Spp Sesi (IDR) *</label>
                      <input 
                        id="form_siswa_spp"
                        type="number"
                        value={formDataSiswa.sppAmount}
                        onChange={(e) => setFormDataSiswa({...formDataSiswa, sppAmount: Number(e.target.value)})}
                        className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button type="button" onClick={() => setNewSiswaOpen(false)} className="px-3 py-1 bg-slate-800 rounded text-xs text-slate-300">Batal</button>
                    <button type="submit" id="btn_submit_student" className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold">Simpan & Sync</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-12 gap-4">
                {/* DYNAMIC QR SESSION GENERATOR (CLASS-SPECIFIC / DAY-SPECIFIC) */}
                <div className="col-span-12 lg:col-span-5 bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                        <QrCode className="w-4 h-4 text-purple-600" />
                        <span>Sistem Presensi Generator QR Dan Lokasi GPS</span>
                      </h3>
                      <button 
                        id="btn_regenerate_qr"
                        onClick={() => {
                          const randCode = `QR-CLASS-${Math.floor(1000 + Math.random() * 9000)}`;
                          setQrSession({
                            sessionId: `SES-${Math.floor(2026 + Math.random() * 100)}`,
                            courseName: schedules[Math.floor(Math.random() * schedules.length)].classTitle,
                            code: randCode,
                            generatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                          });
                          triggerToast("Token Sesi QR-Attendance diperbaharui! Suku kurikulum meningkat.", "success");
                          addSyncLog(`Generated unique QR reference session matching ${randCode}`);
                        }}
                        className="text-[10px] text-blue-600 hover:underline font-mono"
                      >
                        [ Ganti Kode Sesi ]
                      </button>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/60 rounded p-2.5 text-center flex flex-col items-center">
                      <p className="text-[10px] text-slate-500 font-semibold mb-1">PINDAI QR DIBAWAH ATAU VERIFIKASI SEBELUM 08.00</p>
                      
                      {/* Generates a stylized visual QR mock using Canvas emulation blocks */}
                      <div className="w-32 h-32 bg-white border-2 border-slate-200 rounded p-1 flex flex-col justify-between relative overflow-hidden shadow-inner my-2">
                        <div className="flex justify-between h-4">
                          <div className="w-4 h-4 bg-slate-900 border border-slate-700 rounded-sm"></div>
                          <div className="w-1.5 h-1 bg-slate-500 rounded"></div>
                          <div className="w-4 h-4 bg-slate-900 border border-slate-700 rounded-sm"></div>
                        </div>
                        {/* QR Grid lines mockup */}
                        <div className="flex-1 flex flex-col justify-around py-2 px-1">
                          <div className="h-0.5 bg-slate-800 w-11/12 mx-auto"></div>
                          <div className="h-0.5 bg-slate-800 w-2/3"></div>
                          <div className="h-0.5 bg-slate-800 w-3/4 mx-auto"></div>
                          <div className="h-0.5 bg-slate-800 w-11/12"></div>
                          <div className="h-0.5 bg-slate-800 w-5/6"></div>
                        </div>
                        <div className="flex justify-between h-4">
                          <div className="w-4 h-4 bg-slate-900 border border-slate-700 rounded-sm"></div>
                          <div className="w-4 h-1.5 bg-slate-400 rounded-sm"></div>
                          <div className="w-4 h-4 bg-slate-900 border border-slate-700 rounded-sm"></div>
                        </div>

                        {/* Scan laser visual effect to make look stunning */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 opacity-60 animate-pulse"></div>
                      </div>

                      <div className="mt-1">
                        <span className="text-[11px] font-bold text-slate-800 block leading-tight">{qrSession.courseName}</span>
                        <span className="text-[9px] text-slate-400 font-mono block">KODE: {qrSession.code} ({qrSession.generatedAt} WIB)</span>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded p-2.5 mt-2 text-[11px] text-slate-600">
                      <div className="font-bold text-blue-900 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        <span>Koordinat Lokasi Kampus Les</span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-normal mt-0.5">HQ Jakarta: <b>-6.2088 Latitude, 106.8456 Longitude</b>. Presensi GPS wajib diaktifkan oleh siswa di zona radius max 20 meter.</p>
                      
                      <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-blue-200">
                        <button 
                          id="btn_gps_test"
                          type="button" 
                          onClick={queryBrowserGeolocation}
                          disabled={gpsLoading}
                          className="bg-white hover:bg-blue-100 border border-blue-300 px-2 py-0.5 rounded text-[10px] text-blue-700 font-bold flex items-center gap-1 transition"
                        >
                          <Target className="w-2.5 h-2.5" />
                          {gpsLoading ? 'Mencari Satelit...' : 'Validasi Kedekatan Lokasi Anda'}
                        </button>
                        
                        {gpsLocation && (
                          <span className="text-[9px] font-mono text-emerald-700 font-bold">
                            Lock: {gpsLocation.lat.toFixed(4)}, {gpsLocation.lon.toFixed(4)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3.5 mt-2.5">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Simulasi Cepat Presensi</h4>
                    <div className="grid grid-cols-2 gap-1.5">
                      <select 
                        id="simulation_student_selector"
                        className="text-xs border border-slate-200 bg-white p-1 rounded font-semibold"
                        onChange={(e) => {
                          if (e.target.value) {
                            simulateCheckinSiswa(e.target.value, 'QR_SCAN');
                            e.target.value = ''; // reset option
                          }
                        }}
                      >
                        <option value="">-- Simulasi QR Scan --</option>
                        {siswas.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>

                      <select 
                        id="simulation_student_gps_selector"
                        className="text-xs border border-slate-200 bg-white p-1 rounded font-semibold"
                        onChange={(e) => {
                          if (e.target.value) {
                            simulateCheckinSiswa(e.target.value, 'LOKASI');
                            e.target.value = ''; 
                          }
                        }}
                      >
                        <option value="">-- Simulasi Geolocation --</option>
                        {siswas.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* VISUAL REGISTERED STUDENTS TABLE LIST */}
                <div className="col-span-12 lg:col-span-7 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
                  <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">Siswa & Laporan Kehadiran Berdasar QR-GPS</span>
                    <span className="text-[10px] text-slate-500 font-mono">Filter Hasil: {filteredSiswas.length}</span>
                  </div>

                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 text-[9px] uppercase font-bold text-slate-500 border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="p-3">ID SISWA</th>
                          <th className="p-3">NAMA</th>
                          <th className="p-3">PRESENSI HARI INI</th>
                          <th className="p-3">KEHADIRAN BULANAN</th>
                          <th className="p-3">NILAI DIAGNOSTIK</th>
                          <th className="p-3 text-right">INVOICE SPP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredSiswas.map(student => (
                          <tr 
                            key={student.id} 
                            onClick={() => setSelectedSiswaId(student.id)}
                            className={`hover:bg-slate-50/80 cursor-pointer transition ${selectedSiswaId === student.id ? 'bg-blue-50/40 border-l-2 border-blue-600' : ''}`}
                          >
                            <td className="p-3 font-mono font-bold text-slate-500">{student.id}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <img src={student.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} alt="" className="w-6 h-6 rounded-full object-cover shadow-sm" />
                                <div>
                                  <span className="font-semibold text-slate-800 block text-[11px]">{student.name}</span>
                                  <span className="text-[9px] text-slate-400 block">{student.classLevel}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              {student.locationCheckedIn ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono block w-fit">
                                  HADIR ({student.checkInTime || '07:44'})
                                </span>
                              ) : (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono block w-fit">
                                  TERLAMBAT / ABSEN
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold">{student.attendanceRate}%</span>
                                <div className="w-12 bg-slate-100 h-1 rounded-full overflow-hidden">
                                  <div className="bg-purple-500 h-full" style={{ width: `${student.attendanceRate}%` }}></div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`font-mono font-extrabold ${student.performanceScore >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {student.performanceScore}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button 
                                id={`spp_badge_${student.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSppPaymentStatus(student.id);
                                }}
                                className={`text-[9px] font-extrabold px-2 py-0.5 rounded transition ${
                                  student.sppStatus === 'LUNAS' 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {student.sppStatus === 'LUNAS' ? 'LUNAS' : '⚠️ BELUM BAYAR'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: SCHEDULES & TEACHER EVALUATIONS PANEL */}
          {activeTab === 'pengajar' && (
            <div id="panel_pengajar" className="space-y-4 flex flex-col flex-1">
              
              <div className="grid grid-cols-12 gap-4">
                
                {/* ACTIVE CLASSES SCHEDULE LIST */}
                <div className="col-span-12 lg:col-span-6 bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Jadwal Sesi Pembelajaran Aktif Hari Ini</h3>
                    <span className="text-[10px] text-slate-500 font-mono">{schedules.length} Sesi Terjadwal</span>
                  </div>

                  <div className="space-y-2 overflow-y-auto max-h-96 pr-1">
                    {schedules.map(sch => (
                      <div key={sch.id} className="p-2.5 rounded-lg border border-slate-200 flex justify-between items-center bg-slate-50/60 hover:bg-slate-50 transition">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-800">{sch.classTitle}</span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${
                              sch.status === 'SEDANG_BERLANGSUNG' ? 'bg-red-100 text-red-700 animate-pulse' :
                              sch.status === 'AKAN_DATANG' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                            }`}>{sch.status}</span>
                          </div>

                          <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1 font-mono">
                            <span className="flex items-center gap-0.5">
                              <Users className="w-3 h-3 text-slate-400" />
                              {sch.teacherName}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {sch.startTime} - {sch.endTime} WIB
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold text-blue-600 block">{sch.roomCode}</span>
                          <span className="text-[9px] text-slate-400 font-mono block">Offline HQ</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TEACHER EVALUATIONS SYSTEM (EVALUASI BERKALA GURU) */}
                <div className="col-span-12 lg:col-span-6 bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Evaluasi Berkala & Efisiensi Pengajar</h3>
                    
                    <form id="evaluation_form" onSubmit={handleSubmitTeacherEvaluation} className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">Pilih Pengajar</label>
                          <select 
                            id="eval_teacher_select"
                            value={evalTeacherId}
                            onChange={(e) => setEvalTeacherId(e.target.value)}
                            className="w-full text-xs px-2 py-1 border border-slate-200 rounded bg-white text-slate-700"
                          >
                            {teachers.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-3 gap-1">
                          <div>
                            <label className="block text-[8px] text-slate-400 uppercase font-bold text-center">Pedagogis</label>
                            <input 
                              id="eval_pedagogic"
                              type="number" 
                              min="1" 
                              max="5" 
                              value={pedagogicalScore} 
                              onChange={(e) => setPedagogicalScore(Number(e.target.value))}
                              className="w-full text-center p-1 bg-white border rounded text-xs" 
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-slate-400 uppercase font-bold text-center">Profesional</label>
                            <input 
                              id="eval_professional"
                              type="number" 
                              min="1" 
                              max="5" 
                              value={professionalScore} 
                              onChange={(e) => setProfessionalScore(Number(e.target.value))}
                              className="w-full text-center p-1 bg-white border rounded text-xs" 
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-slate-400 uppercase font-bold text-center">Sosial</label>
                            <input 
                              id="eval_social"
                              type="number" 
                              min="1" 
                              max="5" 
                              value={socialScore} 
                              onChange={(e) => setSocialScore(Number(e.target.value))}
                              className="w-full text-center p-1 bg-white border rounded text-xs" 
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">Catatan Kinerja & Evaluasi Guru *</label>
                        <input 
                          id="eval_feedback_input"
                          type="text"
                          required
                          placeholder="Contoh: Sangat interaktif dalam mengajarkan integral aljabar..."
                          value={evalFeedback}
                          onChange={(e) => setEvalFeedback(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                        />
                      </div>

                      <button 
                        id="btn_submit_evaluation"
                        type="submit" 
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-1 px-2 rounded text-[11px] text-center"
                      >
                        Simpan Evaluasi & Rekalkulasi Rating Berkala
                      </button>
                    </form>

                    {/* TEACHER LIST WITH PERFORMANCE INDICATOR */}
                    <div className="mt-3 space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peringkat & Skor Guru Terpercaya</h4>
                      
                      {teachers.map(t => (
                        <div key={t.id} className="p-2 border border-slate-100 rounded-lg bg-slate-100/50 text-xs flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <img src={t.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover bg-slate-200" />
                            <div>
                              <span className="font-bold text-slate-800 block text-[11px]">{t.name}</span>
                              <span className="text-[9px] text-slate-400 font-mono block">Sub: {t.subjects.join(', ')}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] font-bold text-blue-600 block">Rating: ★ {t.rating.toFixed(1)}/5.0</span>
                            <span className="text-[9px] text-slate-500 font-mono block">Kehadiran Mengajar: {t.attendanceRate}%</span>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: LAPORAN SPP & COST TRANSPARENCY OPERASIONAL */}
          {activeTab === 'spp' && (
            <div id="panel_spp" className="space-y-4 flex flex-col flex-1">
              
              <div className="grid grid-cols-12 gap-4">
                
                {/* SCHOOL OPERATIONAL COSTS TRANSPARENCY - TRANSPARAN FOR WALI */}
                <div className="col-span-12 lg:col-span-7 bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                      <span>Sistem Manajemen Biaya Operasional Transparan Bagi Wali Murid</span>
                      <span className="bg-emerald-100 text-emerald-800 font-mono text-[9px] font-bold px-2 py-0.2 rounded">Beban Transparan</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 mb-2">Kas operasional bulanan sekolah yang disinkronisasi secara akurat dan dibagi rata per siswa untuk pertanggungjawaban kas yang bersih.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 font-bold text-slate-500 uppercase text-[9px] border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">NAMA KEBUTUHAN OPERASIONAL</th>
                          <th className="p-2.5 text-right">TOTAL BIAYA</th>
                          <th className="p-2.5 text-right">SHARE PER SISWA</th>
                          <th className="p-2.5 text-center">KATEGORI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {INITIAL_BIAYA_OPERASIONAL.map(b => (
                          <tr key={b.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-sans font-semibold text-slate-800 text-[11px]">{b.itemName}</td>
                            <td className="p-2.5 text-right font-bold text-slate-700">Rp {b.totalCost.toLocaleString('id-ID')}</td>
                            <td className="p-2.5 text-right font-bold text-blue-600">Rp {b.siswaShare.toLocaleString('id-ID')}</td>
                            <td className="p-2.5 text-center">
                              <span className="bg-slate-200 text-slate-800 text-[8px] font-bold px-1.5 py-0.2 rounded font-sans uppercase">
                                {b.category}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3.5 bg-slate-900 text-slate-300 p-2.5 rounded-lg flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="block font-sans font-bold text-white text-[11px]">Akumulasi Beban Per Siswa / Bulan</span>
                      <span className="text-[9px] text-slate-400">Total operational divided collectively</span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-[#10b981] block">Rp {costPerSiswaCalculated.toLocaleString('id-ID')}</span>
                      <span className="text-[9px] text-slate-400 font-sans">Sisa Kas: Re-investasi Fasilitas</span>
                    </div>
                  </div>
                </div>

                {/* TRANSACTION LEDGER REALTIME BILLING STATUS */}
                <div className="col-span-12 lg:col-span-5 bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Buku Besar Transaksi Keuangan Bimbel</h3>
                    
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {transactions.map(tx => (
                        <div key={tx.id} className="p-2 border border-slate-100 rounded bg-slate-50/60 hover:bg-slate-50 transition text-xs flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800 text-[11px] block">{tx.payeeName}</span>
                            <span className="text-[9px] text-slate-500 font-mono block">Tgl: {tx.date} | Ket: {tx.notes}</span>
                          </div>

                          <div className="text-right">
                            <span className={`font-mono font-bold block ${
                              tx.type === 'SPP_MASUK' ? 'text-emerald-600' : 'text-red-500'
                            }`}>
                              {tx.type === 'SPP_MASUK' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[8px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded uppercase inline-block">
                              {tx.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 mt-2 text-[10px] text-slate-500 font-semibold space-y-1 bg-slate-50 p-2 rounded">
                    <div className="flex justify-between">
                      <span>Total SPP Masuk Bulan Ini:</span>
                      <span className="text-emerald-600 font-bold font-mono">Rp {totalSPPCollected.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Beban Operasional:</span>
                      <span className="text-red-500 font-bold font-mono">Rp {totalOperationalCost.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: LEARNING CONTENT & INTERACTIVE QUIZZES PANEL */}
          {activeTab === 'modul' && (
            <div id="panel_modul" className="space-y-4 flex flex-col flex-1">
              
              {/* FILTER BAR FOR MODUL */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col md:flex-row gap-2.5 items-center justify-between">
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                    <input 
                      id="materi_search_input"
                      type="text"
                      placeholder="Cari materi rumus cepat, video, PDF..."
                      value={materiSearch}
                      onChange={(e) => setMateriSearch(e.target.value)}
                      className="w-full pl-8 pr-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700"
                    />
                  </div>

                  <select 
                    id="filter_materi_subject"
                    value={materiSubjectFilter}
                    onChange={(e) => setMateriSubjectFilter(e.target.value)}
                    className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                  >
                    <option value="Semua">Semua Mata Pelajaran</option>
                    <option value="Matematika">Matematika</option>
                    <option value="Fisika">Fisika</option>
                    <option value="Kimia">Kimia</option>
                    <option value="Bahasa Inggris">Bahasa Inggris</option>
                  </select>
                </div>

                <button 
                  id="btn_open_materi_modal"
                  onClick={() => setNewMateriOpen(!newMateriOpen)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Unggah Materi Belajar</span>
                </button>
              </div>

              {/* UNGGAH MATERI ONLINE FORM */}
              {newMateriOpen && (
                <form id="upload_materi_form" onSubmit={handleAddMateri} className="bg-slate-900 text-white border border-slate-800 rounded-lg p-4 animate-fadeIn space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>Unggah Modul Belajar & Akses Kontrol Peran</span>
                    </h3>
                    <button type="button" onClick={() => setNewMateriOpen(false)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Judul Topik / Lembar Kerja *</label>
                      <input 
                        id="form_materi_title"
                        type="text"
                        required
                        placeholder="Contoh: Rumus Cepat Integral Trigonometri"
                        value={formDataMateri.title}
                        onChange={(e) => setFormDataMateri({...formDataMateri, title: e.target.value})}
                        className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Mata Pelajaran *</label>
                      <select 
                        id="form_materi_subject"
                        value={formDataMateri.subject}
                        onChange={(e) => setFormDataMateri({...formDataMateri, subject: e.target.value})}
                        className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white"
                      >
                        <option value="Matematika">Matematika</option>
                        <option value="Fisika">Fisika</option>
                        <option value="Kimia">Kimia</option>
                        <option value="Bahasa Inggris">Bahasa Inggris</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Format Berkas *</label>
                      <select 
                        id="form_materi_type"
                        value={formDataMateri.type}
                        onChange={(e) => setFormDataMateri({...formDataMateri, type: e.target.value as 'PDF' | 'VIDEO' | 'TUGAS'})}
                        className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white"
                      >
                        <option value="PDF">PDF (Dokumen)</option>
                        <option value="VIDEO">MP4 (Video Pembahasan)</option>
                        <option value="TUGAS">DOCX / TUGAS</option>
                      </select>
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Tingkat Kelas Sasaran *</label>
                      <input 
                        id="form_materi_level"
                        type="text"
                        placeholder="Contoh: 12 SMA atau Siswa Umum"
                        value={formDataMateri.targetLevel}
                        onChange={(e) => setFormDataMateri({...formDataMateri, targetLevel: e.target.value})}
                        className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <input 
                        id="form_materi_locked"
                        type="checkbox"
                        checked={formDataMateri.isLocked}
                        onChange={(e) => setFormDataMateri({...formDataMateri, isLocked: e.target.checked})}
                        className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-700 rounded"
                      />
                      <label className="text-[11px] text-slate-300 font-bold uppercase select-none flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        Akses Terkunci (Khusus Premium)
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button type="button" onClick={() => setNewMateriOpen(false)} className="px-3 py-1 bg-slate-800 rounded text-xs text-slate-300">Batal</button>
                    <button type="submit" id="btn_submit_materi" className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold">Terbitkan Modul</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-12 gap-4">
                
                {/* LIST OF MATERI BELAJAR */}
                <div className="col-span-12 lg:col-span-7 bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Sistem Repository Pembelajaran Terintegrasi Kelompok</h3>
                      <span className="text-[10px] text-slate-500 font-mono">{filteredMateris.length} Berkas Materi</span>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {filteredMateris.map(mat => (
                        <div key={mat.id} className="p-2.5 rounded-lg border border-slate-200 flex justify-between items-center bg-slate-50/60 hover:bg-slate-50 transition text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center font-bold text-blue-600 shrink-0">
                              {mat.type === 'PDF' && <FileText className="w-4 h-4 text-red-500" />}
                              {mat.type === 'VIDEO' && <Video className="w-4 h-4 text-emerald-500" />}
                              {mat.type === 'TUGAS' && <Layers className="w-4 h-4 text-amber-500" />}
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800 text-[11px]">{mat.title}</span>
                                {mat.isLocked && (
                                  <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.2 rounded font-sans flex items-center gap-0.5">
                                    <Lock className="w-2.5 h-2.5 text-amber-700" /> Premium
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-slate-500 font-mono block mt-0.5">MP: {mat.subject} | Tingkat: {mat.targetLevel} | Diunggah: {mat.uploadDate}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-mono text-slate-500 block">{mat.downloadsCount}x Diunduh</span>
                            <button 
                              id={`download_btn_${mat.id}`}
                              onClick={() => {
                                triggerToast(`Memulai proses unduh berkas: ${mat.title}`, "success");
                                setMateris(prev => {
                                  return prev.map(m => m.id === mat.id ? { ...m, downloadsCount: m.downloadsCount + 1 } : m);
                                });
                              }}
                              className="text-[10px] hover:underline text-blue-600 font-semibold"
                            >
                              Unduh Materi
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-100 p-2.5 rounded border mt-3 text-[10px] text-slate-500 font-mono flex justify-between">
                    <span>Akses Siswa: {currentUserRole === 'SISWA' ? 'LOCK_PREVENTED (Siswa)' : 'ADMIN_GRANT_FULL'}</span>
                    <span>Wajib Sinkron Sebelum Ujian</span>
                  </div>
                </div>

                {/* INTERACTIVE QUIZZES FOR STUDENTS (KUIS INTERAKTIF) */}
                <div className="col-span-12 lg:col-span-5 bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Simulasi Kuis Interaktif & Diagnostic</h3>
                    
                    {!activeQuizPlay ? (
                      <div className="space-y-3">
                        <p className="text-[10px] text-slate-400">Pilih salah satu kuis aktif untuk diputar. Hasil kuis instan diintegrasikan ke sistem penilaian siswa yang terpilih di menu Ringkasan Utama.</p>
                        
                        {quizzes.map(qz => (
                          <div key={qz.id} className="p-2.5 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between text-xs transition">
                            <div>
                              <span className="font-bold text-slate-800 block text-[11px]">{qz.title}</span>
                              <span className="text-[9px] text-slate-500 font-mono block">Sub: {qz.subject} • Kelas: {qz.classLevel}</span>
                            </div>

                            <button 
                              id={`play_quiz_${qz.id}`}
                              onClick={() => handleStartQuiz(qz)}
                              className="bg-slate-900 text-white hover:bg-slate-800 font-bold px-2.5 py-1 rounded text-[10px]"
                            >
                              Mainkan Kuis ★
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 animate-fadeIn space-y-3">
                        <div className="flex justify-between items-center border-b pb-1.5">
                          <span className="font-bold text-slate-800 text-[11px]">{activeQuizPlay.title}</span>
                          <button onClick={() => setActiveQuizPlay(null)} className="text-slate-400 font-bold">X</button>
                        </div>

                        {activeQuizPlay.questions.map((q, qIndex) => (
                          <div key={q.id} className="space-y-1.5">
                            <p className="font-semibold text-slate-800">{qIndex + 1}. {q.question}</p>
                            <div className="space-y-1">
                              {q.options.map((opt, optIndex) => (
                                <button 
                                  id={`q_option_${q.id}_${optIndex}`}
                                  key={optIndex}
                                  type="button"
                                  onClick={() => handleSelectQuizAnswer(q.id, optIndex)}
                                  className={`w-full text-left p-2 rounded border text-[11px] transition ${
                                    quizAnswers[q.id] === optIndex 
                                      ? 'bg-blue-600 text-white border-blue-700' 
                                      : 'bg-white hover:bg-slate-100'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}

                        {!quizResult ? (
                          <button 
                            id="btn_submit_answers"
                            onClick={handleSubmitQuiz}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded text-[11px]"
                          >
                            Kirim Jawaban Kuis
                          </button>
                        ) : (
                          <div className="bg-emerald-100 text-emerald-800 p-2.5 rounded text-center">
                            <span className="text-xs font-bold block">Hasil Kuis: {quizResult.score}%</span>
                            <p className="text-[9px] text-slate-600 mt-1">Status Penilaian: Nilai berhasil diskalakan langsung ke rapor privat siswa terpilih!</p>
                            
                            <button 
                              id="btn_close_quiz_result"
                              onClick={() => {
                                setActiveQuizPlay(null);
                                setQuizResult(null);
                              }}
                              className="mt-2 text-[10px] text-blue-600 underline font-bold"
                            >
                              Selesai & Tutup Kuis
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-2 border-t mt-3.5 bg-slate-50 font-mono text-[9px] text-slate-400">
                    Siswa teraktif saat ini: <b>Budi Santoso</b> (+2 kuis terselesaikan)
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 6: STRICT ROLE BASED ACCESS MATRIX */}
          {activeTab === 'hak_akses' && (
            <div id="panel_hak_akses" className="space-y-4 flex flex-col flex-1">
              <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Matriks Ketat Kontrol Akses Peran Pengguna (RBAC)</h3>
                <p className="text-[10px] text-slate-400 mb-3.5">EduAdmin Bimbel memperkuat sistem penegakan akses demi menjaga integritas data keuangan SPP dan penilaian akademik siswa.</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse border border-slate-200">
                    <thead className="bg-slate-900 text-white font-bold text-[9px] uppercase">
                      <tr>
                        <th className="p-3 border">KEMAMPUAN FITUR SISTEM</th>
                        <th className="p-3 border text-center">ADMINISTRATOR</th>
                        <th className="p-3 border text-center">GURU / TUTOR</th>
                        <th className="p-3 border text-center">WALI MURID</th>
                        <th className="p-3 border text-center">SISWA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      <tr>
                        <td className="p-3 border font-semibold text-slate-700">Mengelola data keuangan bimbel & SPP</td>
                        <td className="p-3 border text-center text-emerald-600 font-bold bg-slate-50">✓ FULL ACCESS</td>
                        <td className="p-3 border text-center text-slate-400">✗ TERKUNCI</td>
                        <td className="p-3 border text-center text-slate-500">LIHAT LUNAS</td>
                        <td className="p-3 border text-center text-slate-400">✗ TERKUNCI</td>
                      </tr>
                      <tr>
                        <td className="p-3 border font-semibold text-slate-700">Mengevaluasi Kinerja Guru Berkala</td>
                        <td className="p-3 border text-center text-emerald-600 font-bold bg-slate-50">✓ FULL ACCESS</td>
                        <td className="p-3 border text-center text-slate-400">✗ TERKUNCI</td>
                        <td className="p-3 border text-center text-slate-400">✗ TERKUNCI</td>
                        <td className="p-3 border text-center text-slate-400">✗ TERKUNCI</td>
                      </tr>
                      <tr>
                        <td className="p-3 border font-semibold text-slate-700">Absensi Scan QR & Lokasi GPS</td>
                        <td className="p-3 border text-center text-slate-500">LIHAT DATA</td>
                        <td className="p-3 border text-center text-blue-600 font-bold bg-slate-50">✓ MANIFEST</td>
                        <td className="p-3 border text-center text-slate-500">LIHAT LAPORAN</td>
                        <td className="p-3 border text-center text-indigo-600 font-bold bg-slate-50">✓ SCAN AKTIF</td>
                      </tr>
                      <tr>
                        <td className="p-3 border font-semibold text-slate-700">Unggah Materi Belajar Premium</td>
                        <td className="p-3 border text-center text-emerald-600 font-bold">✓ FULL ACCESS</td>
                        <td className="p-3 border text-center text-blue-600 font-bold bg-slate-50">✓ UNGGAH</td>
                        <td className="p-3 border text-center text-slate-400">✗ TERKUNCI</td>
                        <td className="p-3 border text-center text-slate-500">✗ LIHAT PDF SAJA</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-slate-700 mt-4 flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block">Bagaimana Cara Menguji Kontrol Keamanan?</span>
                    <span className="text-[10px] text-slate-600">Anda dapat mengubah peran akses Anda melalui menu dropdown [Kontrol Peran Aktif] di pojok kiri atas bilah navigasi. Perubahan peran visual ini merefleksikan otorisasi pengeditan data di panel secara dinamis.</span>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <footer id="footer_bar" className="h-8 bg-slate-900 border-t border-slate-800 flex items-center px-4 justify-between shrink-0 text-[10px] text-slate-500 font-mono">
          <div>STATUS INFRA: <span className="text-emerald-500 font-bold">● OPERATING OPTIMAL</span> | LOKASI: INDONESIA_HQ_GPS_CENTRIC | OFFLINE: <span className={offlineMode ? 'text-amber-500 font-bold' : 'text-slate-500'}>{offlineMode ? 'STANDBY_QUEUE' : 'OFF'}</span></div>
          <div className="hidden sm:inline">© 2026 EDUADMIN BIMBEL • MANAJEMEN TRANSPARAN OPERASIONAL SELESAI</div>
        </footer>

      </main>

    </div>
  );
}
