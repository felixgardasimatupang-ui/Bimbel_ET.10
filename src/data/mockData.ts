import { Siswa, Teacher, Transaksi, Schedule, MateriBelajar, Notifikasi, InteractiveQuiz } from '../types';

export const INITIAL_SISWA: Siswa[] = [
  {
    id: "SIS-2023-001",
    name: "Budi Santoso",
    classLevel: "12 SMA - IPA",
    performanceScore: 88.5,
    attendanceRate: 95.8,
    email: "budi.santoso@siswa.edu",
    parentName: "Hendra Santoso",
    parentEmail: "hendra.s@parent.com",
    sppStatus: "LUNAS",
    sppAmount: 750000,
    progressHistory: [
      { month: "Jan", score: 82, attendance: 90 },
      { month: "Feb", score: 85, attendance: 95 },
      { month: "Mar", score: 84, attendance: 100 },
      { month: "Apr", score: 87, attendance: 92 },
      { month: "Mei", score: 88.5, attendance: 98 },
    ],
    subjectsScore: [
      { name: "Matematika", score: 90 },
      { name: "Fisika", score: 88 },
      { name: "Kimia", score: 85 },
      { name: "B. Inggris", score: 91 }
    ],
    qrCodeData: "QR-BUDI-SANTOSO-001",
    locationCheckedIn: true,
    latitude: -6.2088,
    longitude: 106.8456,
    checkInTime: "07:45",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
  },
  {
    id: "SIS-2023-014",
    name: "Siti Aminah",
    classLevel: "12 SMA - IPS",
    performanceScore: 92.1,
    attendanceRate: 98.2,
    email: "siti.aminah@siswa.edu",
    parentName: "Ahmad Malik",
    parentEmail: "ahmad.m@parent.com",
    sppStatus: "BELUM_BAYAR",
    sppAmount: 750000,
    progressHistory: [
      { month: "Jan", score: 89, attendance: 100 },
      { month: "Feb", score: 90, attendance: 98 },
      { month: "Mar", score: 91, attendance: 96 },
      { month: "Apr", score: 91.5, attendance: 98 },
      { month: "Mei", score: 92.1, attendance: 100 },
    ],
    subjectsScore: [
      { name: "Ekonomi", score: 95 },
      { name: "Sosiologi", score: 92 },
      { name: "Geografi", score: 89 },
      { name: "B. Inggris", score: 93 }
    ],
    qrCodeData: "QR-SITI-AMINAH-014",
    locationCheckedIn: true,
    latitude: -6.2102,
    longitude: 106.8441,
    checkInTime: "07:38",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
  },
  {
    id: "SIS-2023-052",
    name: "Doni Herlambang",
    classLevel: "11 SMA - IPA",
    performanceScore: 78.4,
    attendanceRate: 85.0,
    email: "doni.h@siswa.edu",
    parentName: "Suryo Herlambang",
    parentEmail: "suryo.herlambang@parent.com",
    sppStatus: "LUNAS",
    sppAmount: 700000,
    progressHistory: [
      { month: "Jan", score: 72, attendance: 80 },
      { month: "Feb", score: 75, attendance: 85 },
      { month: "Mar", score: 74, attendance: 88 },
      { month: "Apr", score: 76, attendance: 82 },
      { month: "Mei", score: 78.4, attendance: 90 },
    ],
    subjectsScore: [
      { name: "Matematika", score: 75 },
      { name: "Fisika", score: 78 },
      { name: "Kimia", score: 76 },
      { name: "B. Inggris", score: 84 }
    ],
    qrCodeData: "QR-DONI-HERLAMBANG-052",
    locationCheckedIn: false,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"
  },
  {
    id: "SIS-2023-088",
    name: "Rina Wijaya",
    classLevel: "10 SMA",
    performanceScore: 85.0,
    attendanceRate: 91.2,
    email: "rina.w@siswa.edu",
    parentName: "Gunawan Wijaya",
    parentEmail: "gunawan.w@parent.com",
    sppStatus: "LUNAS",
    sppAmount: 650000,
    progressHistory: [
      { month: "Jan", score: 80, attendance: 92 },
      { month: "Feb", score: 82, attendance: 88 },
      { month: "Mar", score: 81, attendance: 90 },
      { month: "Apr", score: 84, attendance: 94 },
      { month: "Mei", score: 85.0, attendance: 92 },
    ],
    subjectsScore: [
      { name: "Matematika", score: 82 },
      { name: "IPA Terpadu", score: 86 },
      { name: "IPS Terpadu", score: 84 },
      { name: "B. Inggris", score: 88 }
    ],
    qrCodeData: "QR-RINA-WIJAYA-088",
    locationCheckedIn: false,
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150"
  }
];

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: "TCH-001",
    name: "Dr. Gunawan Pratama",
    subjects: ["Matematika", "Fisika"],
    rating: 4.9,
    attendanceRate: 98.5,
    evaluationScore: 94.0,
    totalClasses: 24,
    activeStudents: 45,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    evaluations: [
      {
        id: "EV-101",
        date: "2026-05-15",
        reviewer: "Admin Kurikulum",
        pedagogical: 5,
        professional: 5,
        social: 4.8,
        feedback: "Pengajaran sangat fokus, materi runut dan sangat mudah dipahami siswa."
      },
      {
        id: "EV-102",
        date: "2026-04-10",
        reviewer: "Kepala Cabang Bimbel",
        pedagogical: 4.8,
        professional: 4.9,
        social: 5,
        feedback: "Memiliki kepribadian ramah, wali murid sangat mengapresiasi cara komunikasi beliau."
      }
    ]
  },
  {
    id: "TCH-002",
    name: "Siti Rahma, M.Pd.",
    subjects: ["Kimia", "Biologi"],
    rating: 4.7,
    attendanceRate: 95.0,
    evaluationScore: 89.5,
    totalClasses: 18,
    activeStudents: 38,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    evaluations: [
      {
        id: "EV-201",
        date: "2026-05-20",
        reviewer: "Admin Kurikulum",
        pedagogical: 4.5,
        professional: 4.6,
        social: 4.8,
        feedback: "Rencana materi disiapkan dengan baik, kedepannya bisa ditambahkan praktikum kecil."
      }
    ]
  },
  {
    id: "TCH-003",
    name: "Liem Christian, B.Sc.",
    subjects: ["Bahasa Inggris", "TOEFL Prep"],
    rating: 4.8,
    attendanceRate: 97.2,
    evaluationScore: 92.0,
    totalClasses: 22,
    activeStudents: 52,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    evaluations: [
      {
        id: "EV-301",
        date: "2026-05-12",
        reviewer: "Kepala Cabang Bimbel",
        pedagogical: 4.6,
        professional: 4.8,
        social: 4.7,
        feedback: "Menggunakan metode belajar bilingual yang menyenangkan, siswa sangat aktif berpartisipasi."
      }
    ]
  }
];

export const INITIAL_TRANSACTIONS: Transaksi[] = [
  {
    id: "TX-2026-049",
    amount: 750000,
    type: "SPP_MASUK",
    date: "2026-06-09",
    payeeName: "Budi Santoso (Wali Hendra Santoso)",
    status: "LUNAS",
    notes: "Pembayaran SPP Juni 12 SMA"
  },
  {
    id: "TX-2026-048",
    amount: 1200000,
    type: "OPERASIONAL",
    date: "2026-06-08",
    payeeName: "Internet Biznet HQ",
    status: "LUNAS",
    notes: "Tagihan Internet Bulanan HQ"
  },
  {
    id: "TX-2026-047",
    amount: 3500000,
    type: "GAJI_GURU",
    date: "2026-06-05",
    payeeName: "Dr. Gunawan Pratama",
    status: "LUNAS",
    notes: "Insentif Mengajar Mei (24 Sesi)"
  },
  {
    id: "TX-2026-046",
    amount: 210000,
    type: "OPERASIONAL",
    date: "2026-06-03",
    payeeName: "Token Listrik PLN",
    status: "LUNAS",
    notes: "Pembelian Token Ruang Kelas Utama"
  },
  {
    id: "TX-2026-045",
    amount: 700000,
    type: "SPP_MASUK",
    date: "2026-06-01",
    payeeName: "Doni Herlambang (Wali Suryo H.)",
    status: "LUNAS",
    notes: "SPP Juni 11 SMA"
  },
  {
    id: "TX-2026-044",
    amount: 750000,
    type: "SPP_MASUK",
    date: "2026-05-28",
    payeeName: "Siti Aminah (Wali Ahmad M.)",
    status: "TERTUNDA",
    notes: "SPP Juni Terjadwal Debit"
  }
];



export const INITIAL_SCHEDULES: Schedule[] = [
  {
    id: "SCH-001",
    classTitle: "Kelas Matematika Sukses UTBK",
    teacherName: "Dr. Gunawan Pratama",
    startTime: "15:30",
    endTime: "17:00",
    roomCode: "RUANG-ALPHA",
    status: "SEDANG_BERLANGSUNG",
    date: "2026-06-10"
  },
  {
    id: "SCH-002",
    classTitle: "Fisika Mekanika Lanjutan",
    teacherName: "Dr. Gunawan Pratama",
    startTime: "17:15",
    endTime: "18:45",
    roomCode: "RUANG-ALPHA",
    status: "AKAN_DATANG",
    date: "2026-06-10"
  },
  {
    id: "SCH-003",
    classTitle: "TOEFL Prep: Intensive Vocabulary",
    teacherName: "Liem Christian, B.Sc.",
    startTime: "16:00",
    endTime: "17:30",
    roomCode: "RUANG-BETA",
    status: "SEDANG_BERLANGSUNG",
    date: "2026-06-10"
  },
  {
    id: "SCH-004",
    classTitle: "Kimia Organik & Hidrokarbon",
    teacherName: "Siti Rahma, M.Pd.",
    startTime: "19:00",
    endTime: "20:30",
    roomCode: "RUANG-GAMMA",
    status: "AKAN_DATANG",
    date: "2026-06-10"
  }
];

export const INITIAL_MATERI: MateriBelajar[] = [
  {
    id: "MAT-001",
    title: "Rumus Cepat Turunan & Integral Aljabar",
    subject: "Matematika",
    targetLevel: "12 SMA - IPA",
    type: "PDF",
    url: "#",
    uploadDate: "2026-06-03",
    downloadsCount: 145,
    author: "Dr. Gunawan Pratama",
    isLocked: false
  },
  {
    id: "MAT-002",
    title: "Video Pembahasan Mekanika Fluida Dinamis",
    subject: "Fisika",
    targetLevel: "11 SMA",
    type: "VIDEO",
    url: "#",
    uploadDate: "2026-06-05",
    downloadsCount: 82,
    author: "Dr. Gunawan Pratama",
    isLocked: false
  },
  {
    id: "MAT-003",
    title: "Modul TOEFL Masterclass: Listening Section",
    subject: "Bahasa Inggris",
    targetLevel: "Siswa Umum",
    type: "PDF",
    url: "#",
    uploadDate: "2026-06-01",
    downloadsCount: 211,
    author: "Liem Christian, B.Sc.",
    isLocked: true
  },
  {
    id: "MAT-004",
    title: "Lembar Kerja Siswa: Kimia Stoikiometri",
    subject: "Kimia",
    targetLevel: "10 SMA",
    type: "TUGAS",
    url: "#",
    uploadDate: "2026-06-08",
    downloadsCount: 34,
    author: "Siti Rahma, M.Pd.",
    isLocked: false
  }
];

export const INITIAL_QUIZZES: InteractiveQuiz[] = [
  {
    id: "QZ-001",
    title: "Kuis Eksponen & Logaritma Terapan",
    subject: "Matematika",
    classLevel: "12 SMA - IPA",
    questions: [
      {
        id: "q1",
        question: "Jika 3^(x+2) = 81, berapakah nilai x?",
        options: ["1", "2", "3", "4"],
        correctIndex: 1
      },
      {
        id: "q2",
        question: "Berapakah nilai dari 2log(8) + 3log(9)?",
        options: ["3", "4", "5", "6"],
        correctIndex: 2
      }
    ]
  },
  {
    id: "QZ-002",
    title: "Grammar Quiz: Active vs Passive Voice",
    subject: "Bahasa Inggris",
    classLevel: "Siswa Umum",
    questions: [
      {
        id: "q3",
        question: "Choose the correct passive voice: 'The teacher praised the student.'",
        options: [
          "The student was praised by the teacher.",
          "The student is praised by the teacher.",
          "The student praised by the teacher.",
          "The student had praised by the techer."
        ],
        correctIndex: 0
      }
    ]
  }
];

export const INITIAL_NOTIFIKASI: Notifikasi[] = [
  {
    id: "NT-001",
    title: "Pengingat Pembayaran SPP Juni",
    message: "Halo Bapak/Ibu, SPP bulan Juni sebesar Rp 750,000 untuk ananda Siti Aminah belum lunas. Harap melakukan transfer sebelum tanggal 15 Juni agar terekam sistem. Terima kasih.",
    type: "SPP_INFO",
    timestamp: "2026-06-10T08:00:00Z",
    read: false,
    targetRole: "WALI_MURID"
  },
  {
    id: "NT-002",
    title: "Jadwal Try Out UTBK Nasional Terjadwal",
    message: "Try Out UTBK Matematika & TPS Akurasi Tinggi akan dilaksanakan Sabtu ini jam 09.00 di Ruang Alpha & Beta Gedung Bimbel. Siapkan aplikasi EduAdmin Siswa.",
    type: "UJIAN_INFO",
    timestamp: "2026-06-09T14:30:00Z",
    read: true,
    targetRole: "ALL"
  },
  {
    id: "NT-003",
    title: "Pembaharuan Kurikulum Biokimia Terintegrasi",
    message: "Materi belajar Kimia Stoikiometri tingkat lanjut telah ditambahkan oleh Ibu Siti Rahma M.Pd. Silakan unduh PDF di modul materi.",
    type: "PENGUMUMAN",
    timestamp: "2026-06-08T10:15:00Z",
    read: true,
    targetRole: "SISWA"
  }
];

