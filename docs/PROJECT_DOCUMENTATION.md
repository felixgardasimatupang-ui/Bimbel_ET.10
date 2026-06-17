# EduAdmin Bimbel — Dokumentasi Proyek Lengkap

## Ringkasan Proyek
EduAdmin Bimbel adalah platform manajemen bimbingan belajar full-stack dengan:
- Frontend React 19 SPA + TypeScript + Vite
- Backend Express 5 + TypeScript + Prisma ORM
- PostgreSQL sebagai database relasional
- Supabase Auth untuk autentikasi
- Docker + GitHub Actions untuk pengembangan dan deployment

Fitur utama meliputi manajemen siswa, pengajar, SPP/keuangan, materi, kuis, presensi QR/GPS, jadwal, notifikasi, dan audit log.

## Tujuan Dokumentasi
Dokumentasi ini menjelaskan struktur proyek, arsitektur, setup lokal, API, database, keamanan, dan pipeline pengujian untuk pengembang maupun tim operasional.

## Struktur Proyek

```
.
├── README.md                    # Dokumentasi ringkas + panduan cepat
├── docs/                        # Dokumentasi tambahan
│   └── PROJECT_DOCUMENTATION.md # Dokumentasi lengkap ini
├── Dockerfile                   # Build frontend production
├── docker-compose.yml           # Local Docker compose stack
├── package.json                 # Frontend dependencies + scripts
├── tsconfig.json                # TypeScript compiler options
├── vite.config.ts               # Vite config + proxy /api
├── src/                         # Frontend aplikasi
└── backend/                     # Backend Express + Prisma
    ├── package.json
    ├── Dockerfile
    ├── prisma/                  # Prisma schema, seed, migration
    └── src/                     # Server code
```

## Arsitektur

### Frontend
- Entry point: `src/main.tsx`
- Root app: `src/App.tsx`
- Autentikasi: `src/contexts/AuthContext.tsx`
- Data & state global: `src/contexts/DataContext.tsx`
- Panel utama adalah lazy-loaded React components:
  - `RingkasanPanel`
  - `SiswaPanel`
  - `PengajarPanel`
  - `SppPanel`
  - `ModulPanel`
  - `HakAksesPanel`
  - `AuditLogPanel`
- API client: `src/api/client.ts`
- Styling: Tailwind CSS v4, kelas utility di `src/index.css`

### Backend
- Entry point: `backend/src/server.ts`
- Express app setup: `backend/src/app.ts`
- Database ORM: Prisma 6
- Authentication middleware: `backend/src/middleware/auth.ts`
- Role-based access control: `backend/src/middleware/rbac.ts`
- JSON body parsing + cookies + rate limiting + security headers
- Routes:
  - `backend/src/routes/auth.ts`
  - `backend/src/routes/students.ts`
  - `backend/src/routes/teachers.ts`
  - `backend/src/routes/finance.ts`
  - `backend/src/routes/materials.ts`
  - `backend/src/routes/notifications.ts`
  - `backend/src/routes/schedules.ts`
  - `backend/src/routes/audit.ts`
- Error handling: `backend/src/middleware/errorHandler.ts`
- Sentry integration: `backend/src/lib/sentry.ts`

### Database
- Prisma schema: `backend/prisma/schema.prisma`
- PostgreSQL dengan extension `pg_trgm` dan `citext`
- 15 model utama ditambah model pendukung untuk token, audit, dan relasi
- Audit trail: tabel `audit_logs`

## Teknologi Utama

| Lapisan | Teknologi |
|---------|-----------|
| Frontend | React 19, TypeScript 5.8, Vite 6, Tailwind CSS v4, Recharts, Lucide React |
| Backend | Express 5, TypeScript, Prisma 6, PostgreSQL, Zod 4 |
| Auth | Supabase Auth, JWT custom untuk Google OAuth |
| Testing | Vitest, Playwright E2E, Testing Library |
| Infra | Docker, Docker Compose, GitHub Actions |

## Frontend Detail

### Entry & Layout
- `src/main.tsx` memanggil `initSentry()` lalu merender `<App />` di dalam `<AuthProvider>`.
- `src/App.tsx` memilih panel aktif berdasarkan state internal dan menyediakan error boundary per panel.
- Sidebar, header, dan strip statistik adalah komponen global yang tersedia di setiap halaman.

### Autentikasi & State
- `AuthContext` menyimpan user login, token access, dan logout.
- `DataContext` memegang data aplikasi global seperti daftar siswa, pengajar, transaksi, materi, kuis, dan notifikasi.
- Offline mode dan sync lokal diimplementasikan dengan persistensi `localStorage`.

### API Client
- `src/api/client.ts` melakukan request ke backend dengan fitur:
  - `accessToken` global
  - auto-refresh token saat 401 terjadi
  - mutex refresh untuk mencegah permintaan ganda
  - deduplikasi GET request sedang berlangsung
  - retry untuk error 5xx

### Panel Utama
- `RingkasanPanel`: grafik performa, rangkuman SPP, notifikasi, dan detail siswa.
- `SiswaPanel`: list siswa, pencarian, filter kelas, form tambah siswa, QR check-in, GPS check-in.
- `PengajarPanel`: daftar pengajar, jadwal, evaluasi guru.
- `SppPanel`: ringkasan transaksi, biaya operasional, laporan SPP.
- `ModulPanel`: daftar materi, kuis interaktif, materi upload/download.
- `HakAksesPanel`: tabel matriks role dan hak akses.
- `AuditLogPanel`: filter log audit berdasarkan action/entity/tanggal.

## Backend Detail

### Express Middleware
- `helmet` untuk security headers dan Content Security Policy ketat.
- `cors` dengan konfigurasi origin yang bisa berisi beberapa nilai.
- `cookie-parser` untuk cookie refresh token.
- `express-rate-limit` untuk proteksi global dan auth-specific.
- custom malformed JSON handler.

### Auth
- `authenticate` middleware mencoba dua metode:
  1. Supabase JWT via `supabaseAdmin.auth.getUser(token)`
  2. custom JWT untuk Google OAuth users via `jsonwebtoken`
- Jika keduanya valid, user aktif di-attach ke `req.user`.

### RBAC
- `requireRole(...)` membatasi akses route tertentu.
- Role didefinisikan sebagai `SUPER_ADMIN`, `ADMIN`, `FINANCE`, `GURU`, `SISWA`, `WALI_MURID`.

### Routes & Services
- Semua route API diasumsikan prefix `/api/`.
- `auth` menyediakan login, register, refresh, me, logout.
- `students` menyediakan listing, detail, pembuatan siswa, toggle SPP, dan check-in.
- `teachers` menyediakan listing dan evaluasi guru.
- `finance` menyediakan list transaksi, ringkasan, dan transaksi per siswa.
- `materials` menyediakan listing materi, pembuatan materi, dan increment download.
- `notifications` menyediakan listing notifikasi dan broadcast reminders.
- `schedules` menyediakan daftar jadwal aktif.
- `audit-logs` menyediakan listing log audit untuk admin.

### Audit
- Semua mutasi konsekuen bisa tercatat di `audit_logs`.
- Audit mencakup action, entity, user, IP, dan timestamp.

## Database Schema Ringkasan

### Enums Utama
- `UserRole`
- `SppStatus`
- `TransactionType`
- `TransactionStatus`
- `AttendanceStatus`
- `AttendanceMethod`
- `ScheduleStatus`
- `MaterialType`
- `NotificationType`
- `AuditAction`
- `AuditEntity`

### Model Utama
- `User`
- `RefreshToken`
- `Student`
- `SubjectScore`
- `ProgressHistory`
- `Attendance`
- `Transaction`
- `Teacher`
- `Evaluation`
- `Schedule`
- `Material`
- `InteractiveQuiz`
- `QuizQuestion`
- `Notification`
- `AuditLog`

### Hubungan Data
- `Student` → `SubjectScore`, `ProgressHistory`, `Attendance`, `Transaction`
- `Teacher` → `Evaluation`, `Schedule`
- `Notification` optional `userId` untuk notifikasi personal
- `RefreshToken` terkait ke `User`

## API Endpoints

| Route | Method | Auth | RBAC | Deskripsi |
|---|---|---|---|---|
| `/api/health` | GET | no | - | Health check service |
| `/api/auth/register` | POST | no | - | Register user baru |
| `/api/auth/login` | POST | no | - | Login dan terbitkan access token |
| `/api/auth/google` | POST | no | - | Login/register via Google OAuth |
| `/api/auth/refresh` | POST | no | - | Refresh access token |
| `/api/auth/logout` | POST | no | - | Logout dan clear refresh cookie |
| `/api/auth/me` | GET | yes | - | Ambil profil user saat ini |
| `/api/students` | GET | yes | - | List siswa paginated/filter |
| `/api/students/:id` | GET | yes | - | Detail siswa |
| `/api/students` | POST | yes | ADMIN, SUPER_ADMIN, GURU | Tambah siswa |
| `/api/students/:id/toggle-spp` | PUT | yes | ADMIN, SUPER_ADMIN | Toggle status SPP |
| `/api/students/:id/checkin` | PUT | yes | ADMIN, SUPER_ADMIN, GURU | Catat check-in siswa |
| `/api/teachers` | GET | yes | - | List pengajar |
| `/api/teachers/evaluate/:id` | POST | yes | ADMIN, SUPER_ADMIN | Evaluasi guru |
| `/api/finance/transactions` | GET | yes | ADMIN, FINANCE, SUPER_ADMIN | List transaksi |
| `/api/finance/summary` | GET | yes | ADMIN, FINANCE, SUPER_ADMIN | Ringkasan keuangan |
| `/api/finance/students/:id/transactions` | GET | yes | ADMIN, FINANCE, SUPER_ADMIN | Transaksi per siswa |
| `/api/materials` | GET | yes | - | List materi |
| `/api/materials` | POST | yes | ADMIN, SUPER_ADMIN, GURU | Buat materi |
| `/api/materials/:id/download` | PUT | yes | - | Hitungan download materi |
| `/api/notifications` | GET | yes | - | List notifikasi |
| `/api/notifications/spp-reminder` | POST | yes | ADMIN, SUPER_ADMIN | Kirim pengingat SPP |
| `/api/notifications/exam-reminder` | POST | yes | ADMIN, SUPER_ADMIN | Kirim pengingat ujian |
| `/api/schedules` | GET | yes | - | List jadwal |
| `/api/audit-logs` | GET | yes | ADMIN, SUPER_ADMIN | List audit logs |

## Format Respon API
Setiap respons API mengikuti standar JSON:

- `success: true` untuk keberhasilan
- `success: false` untuk kegagalan
- `data` berisi payload
- `error` berisi pesan error
- `details` berisi detail validasi ketika zod gagal

Contoh:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "Pesan error" }
```

## Setup Lokal

### Prasyarat
- Node.js 22+
- npm
- PostgreSQL 16+ atau Docker
- Supabase local (opsional untuk auth jika menggunakan Supabase)

### Install dependencies

```bash
git clone <repo-url>
cd Bimbel_ET.10
npm install
cd backend && npm install && cd ..
```

### Konfigurasi Environment

```bash
cp backend/.env.example backend/.env
cp .env.example .env
```

Edit `backend/.env` dengan nilai yang sesuai:
- `DATABASE_URL`
- `DATABASE_URL_DIRECT`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ORIGIN`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_DEFAULT_ROLE`
- `SENTRY_DSN` (opsional)

### Database

```bash
cd backend
npx prisma db push
npm run db:seed
cd ..
```

### Jalankan Aplikasi

Terminal 1:
```bash
cd backend && npm run dev
```

Terminal 2:
```bash
npm run dev
```

Buka `http://localhost:3000`.

## Docker

### Jalankan dengan Docker Compose

```bash
docker compose up --build
```

### Stop

```bash
docker compose down
```

## Testing

### Frontend

```bash
npm test
npm run test:watch
```

### Backend

```bash
cd backend
npm run test
npm run test:coverage
npx tsc --noEmit
```

## Deployment

### Manual

```bash
npm run build
cd backend && npm run build && cd ..
cd backend && NODE_ENV=production node dist/server.js
npx serve dist -l 3000
```

### Docker Production

```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<your-key>
export DATABASE_URL=<your-postgres-url>
export CORS_ORIGIN=https://yourdomain.com
export NODE_ENV=production

docker compose up --build -d
```

### Database Migration

```bash
cd backend
npm run db:migrate:deploy
npm run db:seed
```

## Environment Variables

### Frontend (`.env` / `VITE_*`)
- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SENTRY_DSN`
- `VITE_GPS_LAT`
- `VITE_GPS_LON`

### Backend (`backend/.env`)
- `DATABASE_URL`
- `DATABASE_URL_DIRECT`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ORIGIN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_DEFAULT_ROLE`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `SENTRY_DSN`
- `PORT`
- `NODE_ENV`

## Troubleshooting

- `PrismaClientInitializationError`: pastikan PostgreSQL hidup dan `DATABASE_URL` benar.
- `Supabase auth.getUser()` gagal: periksa `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`.
- `CORS` error: pastikan `CORS_ORIGIN` tercantum domain frontend.
- `401` berulang: pastikan user aktif di DB dan `npm run db:seed` sudah dijalankan.
- `ERR_MODULE_NOT_FOUND`: jalankan `npx prisma generate` pada `backend`.
- Docker `connection refused`: pastikan PostgreSQL sudah siap sebelum API start.

## Catatan Pengembang

- Database schema dikelola melalui Prisma; semua perubahan schema harus diikuti dengan `npx prisma generate`.
- Endpoint backend menggunakan JSON standar dan error handler global.
- Middleware `validate` mengonversi Zod error menjadi respons API yang konsisten.
- Client frontend menggunakan token refresh otomatis dan deduplikasi GET.
- RBAC penting: semua route terbatas memerlukan `requireRole`.

## Referensi Tambahan
- Dokumen ini berada di `docs/PROJECT_DOCUMENTATION.md`
- Panduan ringkas juga tersedia di `README.md`
- Konfigurasi CI/CD di `.github/workflows/`.
