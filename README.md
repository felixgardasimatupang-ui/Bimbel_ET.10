# EduAdmin Bimbel — Sistem Manajemen Bimbingan Belajar

Full-stack aplikasi manajemen bimbingan belajar dengan React 19 SPA + Express 5 + Prisma + PostgreSQL (Supabase). Mencakup manajemen siswa, pengajar, SPP/keuangan, modul belajar, kuis interaktif, absensi QR/GPS, jadwal, notifikasi, dan kontrol akses berbasis peran (RBAC).

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React 19, TypeScript 5.8 (strict), Vite 6, Tailwind CSS v4, Recharts, Lucide React |
| **Backend** | Express 5, TypeScript, Prisma ORM 6, PostgreSQL (Supabase Auth) |
| **Auth** | Supabase Auth (JWT access + refresh token via Supabase Session) |
| **Validation** | Zod 4 (backend), manual validation (frontend) |
| **Testing** | Vitest + Testing Library (85 tests) |
| **Logging** | Pino (structured JSON logging) |
| **Rate Limiting** | express-rate-limit (200/15m global, 20/15m auth endpoints) |
| **Infrastructure** | Docker, Docker Compose, GitHub Actions CI/CD |
| **Monitoring** | Sentry (opsional via env) |

---

## Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vite :3000)                 │
│                                                         │
│  AuthProvider ─► App ─► DataProvider ─► 6 Lazy Panels   │
│                    │                    │                │
│               LoginPage           Ringkasan, Siswa,     │
│                                   Pengajar, SPP,        │
│                                   Modul, HakAkses       │
└──────────────────────────┬──────────────────────────────┘
                           │ Proxy /api
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Backend (Express :3001)                      │
│                                                          │
│  Middleware: helmet, cors, auth (Supabase JWT), rbac,    │
│              validate (Zod), errorHandler                │
│                                                          │
│  Routes: /auth, /students, /teachers, /finance,          │
│          /materials, /notifications, /schedules,         │
│          /audit-logs                                     │
└──────────────────────┬───────────────────────────────────┘
                       │ Prisma ORM
                       ▼
┌─────────────────────────────────────────────────────────┐
│           PostgreSQL (Supabase :54322 local)              │
│  15 tables + 10 Prisma enums + 13 indexes               │
│  Full audit trail (audit_logs)                          │
└─────────────────────────────────────────────────────────┘
```

### Aliran Data

1. **Login:** Frontend → `POST /api/auth/login` → Supabase Auth verify → JWT tokens disimpan di localStorage
2. **CRUD:** Setiap panel memanggil REST API dengan `Authorization: Bearer <token>`
3. **Token Refresh:** Jika 401, refresh otomatis via `/api/auth/refresh` dengan mutex (anti race condition)
4. **Offline Fallback:** Data lokal via `usePersistedState` (localStorage + XOR/base64) sebagai cache
5. **Audit:** Semua mutasi tercatat di tabel `audit_logs` dengan actor + action + entity
6. **RBAC:** Dua lapisan — server (`requireRole` middleware) + client (sidebar role display)

---

## Struktur Proyek

```
.
├── Dockerfile                     # Multi-stage build frontend
├── docker-compose.yml             # PostgreSQL + API + Frontend
├── .github/workflows/ci.yml       # CI/CD pipeline
├── vite.config.ts                 # Vite + proxy /api → :3001
├── tsconfig.json                  # TypeScript strict mode
├── eslint.config.js               # ESLint flat config
├── package.json                   # Frontend dependencies
├── AGENTS.md                      # AI assistant guide (internal)
│
├── src/                           # Frontend SPA
│   ├── main.tsx                   # Entry → AuthProvider → App
│   ├── App.tsx                    # Auth guard + DataProvider + lazy panels
│   ├── types.ts                   # TypeScript interfaces (11 types)
│   ├── index.css                  # Tailwind CSS v4
│   │
│   ├── api/
│   │   └── client.ts              # HTTP client + typed APIs + auto-refresh mutex
│   │
│   ├── lib/
│   │   └── supabase.ts            # Supabase anon client (frontend)
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx         # Supabase auth state + login/logout
│   │   ├── DataContext.tsx         # Central state (persisted localStorage)
│   │   └── SiswaPanelContext.tsx   # Siswa panel form state
│   │
│   ├── hooks/
│   │   ├── usePersistedState.ts   # localStorage persistence (XOR fallback)
│   │   ├── useSync.ts             # Offline sync tracker
│   │   └── useToast.ts            # Toast notification state
│   │
│   ├── components/
│   │   ├── Sidebar.tsx            # Navigation + role display + logout
│   │   ├── Header.tsx             # Action bar + student selector
│   │   ├── LoginPage.tsx          # Login form (demo hidden in prod)
│   │   ├── RingkasanPanel.tsx     # Dashboard + recharts + student deep-dive
│   │   ├── SiswaPanel.tsx         # Student list + QR + GPS checkin
│   │   ├── PengajarPanel.tsx      # Teacher list + evaluation form
│   │   ├── SppPanel.tsx           # Operational costs + transaction ledger
│   │   ├── ModulPanel.tsx         # Materials + quizzes + interactive quiz
│   │   ├── HakAksesPanel.tsx      # RBAC matrix table
│   │   ├── AuditLogPanel.tsx      # Audit log viewer with filters
│   │   ├── StatsStrip.tsx         # Summary stats bar
│   │   ├── Toast.tsx              # Toast notification UI
│   │   ├── ErrorBoundary.tsx      # Error boundary (edu_* reset)
│   │   └── AvatarWithFallback.tsx # Avatar component with fallback
│   │
│   ├── data/
│   │   └── mockData.ts            # Initial seed data (fallback for localStorage)
│   │
│   ├── utils/
│   │   ├── crypto.ts              # AES-GCM encryption (Web Crypto API)
│   │   └── validation.ts          # Pure utility functions (email, CSV, quiz)
│   │
│   └── test/                      # Vitest unit tests (85 cases)
│       ├── validation.test.ts     # 7 test suites
│       ├── usePersistedState.test.ts
│       ├── AuthContext.test.tsx
│       ├── client.test.ts
│       ├── ErrorBoundary.test.tsx
│       ├── LoginPage.test.tsx
│       ├── SppPanel.test.tsx
│       ├── StatsStrip.test.tsx
│       └── Toast.test.tsx
│
└── backend/                       # Express API server
    ├── Dockerfile                 # Multi-stage build
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    ├── connection-pooling.md      # PgBouncer production guide
    │
    ├── prisma/
    │   ├── schema.prisma          # 15 models + 10 enums + 13 indexes
    │   ├── seed.ts                # Demo data seeder
    │   ├── migrations/            # Prisma Migrate baseline
    │   └── scripts/
    │       └── cleanup-audit-logs.sql  # Audit retention (90 hari)
    │
    └── src/
        ├── server.ts              # Entry (graceful shutdown)
        ├── app.ts                 # Express setup (helmet, cors, rate-limit, routes)
        │
        ├── routes/
        │   ├── auth.ts            # Register, login, refresh, get /me
        │   ├── students.ts        # List, detail, create, toggle SPP, checkin
        │   ├── teachers.ts        # List, evaluate (pedagogik/profesional/sosial)
        │   ├── finance.ts         # Transactions (paginated), summary, student txs
        │   ├── materials.ts       # List (filtered), create, download count
        │   ├── notifications.ts   # List, SPP reminder, exam reminder broadcast
        │   ├── schedules.ts       # List schedules
        │   └── audit.ts           # Audit logs (paginated, filtered)
        │
        ├── middleware/
        │   ├── auth.ts            # Supabase JWT verification
        │   ├── rbac.ts            # Role-based access control
        │   ├── validate.ts        # Zod schema validation
        │   └── errorHandler.ts    # Global error handler (preserves status codes)
        │
        ├── utils/
        │   ├── audit.ts           # Audit log helper (silent fail)
        │   └── logger.ts          # Pino structured logger (secret redaction)
        │
        ├── lib/
        │   └── supabase.ts        # Supabase admin client (backend)
        │
        └── types/
            ├── index.ts           # AuthRequest, JwtPayload
            ├── env.d.ts           # Environment variable types
            └── express.d.ts       # Express type extensions
```

---

## Setup Development

### Prasyarat

- Node.js 22+
- PostgreSQL 16+ (atau Docker)
- Supabase CLI (opsional, untuk local Supabase Auth)
- npm

### 1. Clone & Install

```bash
git clone <repo-url>
cd Bimbel_ET.10

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Konfigurasi Environment

```bash
# Backend
cp backend/.env.example backend/.env

    # Edit backend/.env:
    # - DATABASE_URL: PostgreSQL connection string
    # - SUPABASE_URL: Supabase project URL
    # - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
    # - CORS_ORIGIN: Frontend URL (default: http://localhost:3000)

# Frontend (optional, defaults work locally)
cp .env.example .env

    # Edit .env:
    # - VITE_SUPABASE_URL: Supabase project URL
    # - VITE_SUPABASE_ANON_KEY: Supabase anon key
```

### 3. Database Setup

```bash
# Option A: Local PostgreSQL
cd backend
npx prisma db push     # Sync schema
npm run db:seed         # Seed demo data
cd ..

# Option B: Docker (PostgreSQL + API)
docker compose up --build
```

### 4. Jalankan Development

```bash
# Terminal 1 — Backend (port 3001)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
npm run dev
```

### 5. Login

Buka `http://localhost:3000` dan login dengan kredensial demo (hanya tersedia di development):

| Email | Password | Role |
|-------|----------|------|
| `admin@bimbel.edu` | `admin123` | ADMIN |
| `guru@bimbel.edu` | `guru123` | GURU |
| `siswa@bimbel.edu` | `siswa123` | SISWA |

> Di production, kredensial demo tidak ditampilkan (form login kosong).

---

## Docker

```bash
# Build & jalankan semua service
docker compose up --build

# Service:
#   PostgreSQL :5432
#   API       :3001  (Express)
#   Frontend  :3000  (Vite preview production build)

# Stop
docker compose down
docker compose down -v     # Stop + hapus volume
```

---

## API Endpoints

| Route | Methods | Auth | RBAC | Description |
|-------|---------|------|------|-------------|
| `GET /api/health` | GET | - | - | Health check |
| `POST /api/auth/register` | POST | - | - | Register user baru |
| `POST /api/auth/login` | POST | - | - | Login → JWT tokens |
| `POST /api/auth/refresh` | POST | - | - | Refresh access token |
| `GET /api/auth/me` | GET | ✓ | - | Current user profile |
| `GET /api/students` | GET | ✓ | - | List students (paginated, filtered) |
| `GET /api/students/:id` | GET | ✓ | - | Single student detail |
| `POST /api/students` | POST | ✓ | ADMIN, GURU | Create student |
| `PUT /api/students/:id/toggle-spp` | PUT | ✓ | ADMIN | Toggle SPP LUNAS/BELUM_BAYAR |
| `PUT /api/students/:id/checkin` | PUT | ✓ | ADMIN, GURU | Record attendance (QR/Lokasi/Manual) |
| `GET /api/teachers` | GET | ✓ | - | List teachers + evaluations |
| `POST /api/teachers/evaluate/:id` | POST | ✓ | ADMIN | Evaluate teacher (1-5 scale) |
| `GET /api/finance/transactions` | GET | ✓ | ADMIN, FINANCE | List transactions (paginated) |
| `GET /api/finance/summary` | GET | ✓ | ADMIN, FINANCE | SPP summary + operational costs |
| `GET /api/finance/students/:id/transactions` | GET | ✓ | ADMIN, FINANCE | Student transactions |
| `GET /api/materials` | GET | ✓ | - | List materials (filtered, SISWA sees unlocked only) |
| `POST /api/materials` | POST | ✓ | ADMIN, GURU | Create material |
| `PUT /api/materials/:id/download` | PUT | ✓ | - | Increment download counter |
| `GET /api/notifications` | GET | ✓ | - | List notifications (WALI_MURID/SISWA filtered) |
| `POST /api/notifications/spp-reminder` | POST | ✓ | ADMIN | Broadcast SPP reminder |
| `POST /api/notifications/exam-reminder` | POST | ✓ | ADMIN | Broadcast exam reminder |
| `GET /api/schedules` | GET | ✓ | - | List schedules |
| `GET /api/audit-logs` | GET | ✓ | ADMIN | List audit logs (paginated, filtered) |

### Response Format

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "Pesan error" }

// Zod Validation Error
{ "success": false, "error": "Validasi gagal", "details": { "field": ["error message"] } }

// Paginated
{ "success": true, "data": [...], "pagination": { "page": 1, "limit": 50, "total": 100, "totalPages": 2 } }
```

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error / invalid ID |
| 401 | Unauthenticated (no token / invalid token / expired) |
| 403 | Forbidden (wrong role) |
| 404 | Resource not found |
| 409 | Conflict (duplicate email) |
| 413 | Request body too large (>1MB) |
| 429 | Rate limited |
| 500 | Internal server error |

---

## Database Schema (15 Tables + 10 Enums)

### Enums

| Enum | Values |
|------|--------|
| `UserRole` | SUPER_ADMIN, ADMIN, FINANCE, GURU, SISWA, WALI_MURID |
| `SppStatus` | BELUM_BAYAR, LUNAS |
| `TransactionType` | SPP_MASUK, GAJI_GURU, OPERASIONAL, LAIN_LAIN |
| `TransactionStatus` | LUNAS, TERTUNDA, BATAL |
| `AttendanceStatus` | HADIR, IZIN, SAKIT, ALFA |
| `AttendanceMethod` | QR_SCAN, LOKASI, MANUAL |
| `ScheduleStatus` | AKAN_DATANG, SEDANG_BERLANGSUNG, SELESAI |
| `MaterialType` | PDF, VIDEO, TUGAS |
| `NotificationType` | INFO, SPP_INFO, UJIAN_INFO, JADWAL_INFO, PENGUMUMAN |
| `AuditEntity` | user, student, teacher, transaction, material, notification, schedule, quiz, attendance |
| `AuditAction` | CREATE, UPDATE, DELETE, LOGIN, REGISTER, CHECKIN, EVALUATE, SEED |

### Models

| Model | Key Fields | Indexes |
|-------|-----------|---------|
| `User` | id (cuid), supabaseUid (unique), email (unique), password, role (UserRole), active | email, role, active |
| `RefreshToken` | id, token (unique), userId (FK → User), expiresAt | userId, expiresAt |
| `Student` | id, name, classLevel, email (unique), sppStatus (SppStatus), sppAmount, qrCodeData | name, email, classLevel, sppStatus, active, (sppStatus,active), parentName |
| `SubjectScore` | id, studentId (FK → Student), name, score | studentId |
| `ProgressHistory` | id, studentId (FK → Student), month, score, attendance | studentId |
| `Attendance` | id, studentId (FK → Student), date, status (AttendanceStatus), method (AttendanceMethod) | studentId, date, (studentId,date), status |
| `Transaction` | id, studentId (FK → Student), amount, type (TransactionType), date, status (TransactionStatus) | studentId, type, date, status, (studentId,type,date) |
| `Teacher` | id, name, email (unique), subjects[], rating, evaluationScore | email, active, rating |
| `Evaluation` | id, teacherId (FK → Teacher), date, pedagogical (1-5), professional (1-5), social (1-5), feedback | teacherId, date |
| `Schedule` | id, teacherId (FK → Teacher), classTitle, startTime, endTime, status (ScheduleStatus), teacherName | teacherId, status, startTime, (status,startTime) |
| `Material` | id, title, subject, targetLevel, type (MaterialType), isLocked, downloadsCount | subject, active, isLocked, uploadDate, type, (subject,active) |
| `InteractiveQuiz` | id, title, subject, description | - |
| `QuizQuestion` | id, quizId (FK → InteractiveQuiz), text, options[], correctIndex | quizId |
| `Notification` | id, userId (FK → User, nullable), title, message, type (NotificationType), targetRole, read | userId, targetRole, read, timestamp, type, (targetRole,read) |
| `AuditLog` | id, userId (FK → User, nullable, onDelete: SetNull), action (AuditAction), entity (AuditEntity), entityId, ip | userId, action, entity, createdAt, (entity,entityId), (action,entity,createdAt) |

---

## Authentication & RBAC

### Alur Autentikasi (Supabase Auth)

1. **Register:** `POST /api/auth/register` → Supabase Admin API create user → DB user created → return JWT tokens
2. **Login:** `POST /api/auth/login` → Supabase `signInWithPassword` → verify → return JWT tokens
3. **Token Refresh:** `POST /api/auth/refresh` → Supabase `refreshSession` → new tokens
4. **Verify:** Middleware `auth.ts` → `supabaseAdmin.auth.getUser(token)` → extract `supabaseUid` → lookup DB user

### Role-Based Access Control

RBAC di-enforce di **dua lapisan**:

| Lapisan | Implementasi |
|---------|-------------|
| **Server** | Middleware `requireRole()` di setiap route backend (403 jika tidak memiliki akses) |
| **Client** | Sidebar menampilkan role dari JWT (tidak bisa dimanipulasi user) |

Roles: `SUPER_ADMIN` > `ADMIN` > `FINANCE` > `GURU` > `SISWA` = `WALI_MURID`

### Matriks Akses

| Fitur | ADMIN | GURU | FINANCE | WALI MURID | SISWA |
|-------|-------|------|---------|------------|-------|
| Kelola siswa (CRUD) | ✓ | ✓ (create) | ✗ | ✗ | ✗ |
| Presensi (QR/GPS) | ✓ | ✓ | ✗ | ✗ | ✗ |
| Status SPP toggle | ✓ | ✗ | ✗ | ✗ | ✗ |
| Keuangan (transaksi) | ✓ | ✗ | ✓ | ✗ | ✗ |
| Evaluasi guru | ✓ | ✗ | ✗ | ✗ | ✗ |
| Upload materi | ✓ | ✓ | ✗ | ✗ | ✗ |
| Download materi | ✓ | ✓ | ✓ | ✗ | Terbatas (unlocked) |
| Kuis interaktif | ✓ | ✓ | ✗ | ✗ | ✓ |
| Notifikasi (broadcast) | ✓ | ✗ | ✗ | ✗ | ✗ |
| Audit logs | ✓ | ✗ | ✗ | ✗ | ✗ |
| Manajemen user | ✓ | ✗ | ✗ | ✗ | ✗ |
| Lihat notifikasi | Semua | Semua | Semua | Personal | Personal |

---

## Security Features

| Feature | Detail |
|---------|--------|
| **Supabase Auth** | JWT verification via Supabase Admin API (bukan manual JWT) |
| **RBAC Middleware** | `requireRole()` di setiap route yang membutuhkan akses terbatas |
| **Input Validation** | Zod schemas di semua POST/PUT endpoints (body) |
| **Rate Limiting** | express-rate-limit: 200/15m global, 20/15m untuk auth |
| **Helmet** | HTTP security headers (CSP: self, connect-src Supabase URL) |
| **CORS** | Multi-origin support, wildcard warning di production |
| **Pino Logging** | Structured JSON logging, secret redaction (password, token, Authorization) |
| **Audit Trail** | Semua mutasi tercatat di `audit_logs` dengan userId, action, entity, IP |
| **Error Boundary** | Client-side error isolation per panel, edu_* localStorage reset |
| **CSV Injection** | Sanitasi prefix `=`, `+`, `-`, `@` sebelum ekspor |
| **Rate Limit Client** | 500ms cooldown mutation, 300ms untuk checkin |
| **Token Refresh Mutex** | Anti race condition pada multiple simultaneous 401 |
| **Sentry** | Error tracking (opsional, via `SENTRY_DSN` environment) |
| **ID Validation** | Semua route `:id` memvalidasi panjang minimum 8 karakter + existence check |
| **parseIntSafe** | Helper untuk mencegah NaN crash pada pagination query params |

---

## Testing

### Frontend (Vitest)

```bash
npm test              # Run all 85 tests
npm run test:watch    # Watch mode
```

Cakupan test (9 test files, 85 test cases):

| Test File | Cases | Coverage |
|-----------|-------|----------|
| `validation.test.ts` | 7 suites | Email, CSV sanitasi, filter, class filter, quiz score, SPP percent |
| `usePersistedState.test.ts` | - | localStorage read/write, cross-tab sync |
| `AuthContext.test.tsx` | - | Login flow, token management, error states |
| `client.test.ts` | - | API request, auto-refresh, retry logic |
| `ErrorBoundary.test.tsx` | - | Error catching, reset functionality |
| `LoginPage.test.tsx` | - | Form interaction, validation |
| `SppPanel.test.tsx` | - | Financial data rendering |
| `StatsStrip.test.tsx` | - | Stats summary rendering |
| `Toast.test.tsx` | - | Toast notification behavior |

### Backend (type-check only)

```bash
cd backend
npx tsc --noEmit       # TypeScript strict check
npx prisma validate    # Prisma schema validation
```

---

## CI/CD (GitHub Actions)

Pipeline di `.github/workflows/ci.yml`:

| Job | Steps |
|-----|-------|
| **Frontend** | `npm ci` → lint → typecheck → eslint → test → build |
| **Backend** | `npm ci` → prisma generate → typecheck → db push → seed |
| **Docker** | Build & push images ke `ghcr.io` (hanya main branch) |
| **Sentry Release** | Create Sentry release (hanya main branch, butuh secrets) |

---

## Environment Variables

### Frontend (`VITE_*`)

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `VITE_API_URL` | `http://localhost:3001/api` | No | Backend API URL |
| `VITE_SUPABASE_URL` | - | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | - | Yes | Supabase anon key |
| `VITE_SENTRY_DSN` | - | No | Sentry DSN (opsional) |
| `VITE_GPS_LAT` | `-6.2088` | No | Default latitude (Jakarta) |
| `VITE_GPS_LON` | `106.8456` | No | Default longitude (Jakarta) |

### Backend

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `DATABASE_URL` | - | Yes | PostgreSQL connection string (PgBouncer compatible) |
| `DATABASE_URL_DIRECT` | - | Yes | Direct PostgreSQL connection (for migrations) |
| `SUPABASE_URL` | - | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | - | Yes | Supabase service role key |
| `CORS_ORIGIN` | `http://localhost:3000` | No | Allowed origin(s), comma-separated |
| `PORT` | `3001` | No | Server port |
| `NODE_ENV` | `development` | No | Environment mode |
| `SENTRY_DSN` | - | No | Sentry DSN (opsional) |

---

## Panel Aplikasi

| Panel | Fitur Utama | Komponen |
|-------|-------------|----------|
| **Ringkasan** | Grafik Recharts (performa, SPP), notifikasi real-time, detail siswa per-individu | `RingkasanPanel.tsx` |
| **Siswa** | Daftar siswa + search/filter, QR presensi, GPS check-in, form tambah siswa | `SiswaPanel.tsx` |
| **Pengajar** | Jadwal mengajar, evaluasi performa (pedagogik, profesional, sosial) | `PengajarPanel.tsx` |
| **SPP** | Biaya operasional transparan per-siswa, buku besar transaksi | `SppPanel.tsx` |
| **Modul** | Repository materi (upload/download), kuis interaktif (pilih jawaban, skor) | `ModulPanel.tsx` |
| **Hak Akses** | Matriks RBAC tabel untuk semua role | `HakAksesPanel.tsx` |
| **Audit Log** | Riwayat audit dengan filter action, entity, tanggal | `AuditLogPanel.tsx` |

---

## Panduan Deployment

### Production (Manual)

```bash
# Build frontend
npm run build

# Build backend
cd backend && npm run build && cd ..

# Jalankan backend
cd backend && NODE_ENV=production node dist/server.js

# Serve frontend dengan nginx/serve
npx serve dist -l 3000
```

### Production (Docker)

```bash
# Set environment variables
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<your-key>
export DATABASE_URL=<your-postgres-url>
export CORS_ORIGIN=https://yourdomain.com
export NODE_ENV=production

# Build & run
docker compose up --build -d
```

### Production (Docker + Reverse Proxy)

Rekomendasi: Nginx/Caddy/Traefik di depan untuk:
- SSL/TLS termination
- Static file serving untuk frontend
- Rate limiting tambahan
- WAF protection

### Database Migration

```bash
cd backend
npm run db:migrate:deploy     # Apply pending migrations
npm run seed                  # Seed demo data (first deploy only)
```

### Audit Log Cleanup (Cron)

```bash
# Jalankan SQL via psql untuk hapus audit logs > 90 hari
psql $DATABASE_URL -f backend/prisma/scripts/cleanup-audit-logs.sql
```

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `PrismaClientInitializationError` | Pastikan PostgreSQL running dan `DATABASE_URL` benar |
| `Supabase auth.getUser()` gagal | Pastikan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` benar |
| CORS error | Set `CORS_ORIGIN` sesuai domain frontend |
| 401 terus menerus | Pastikan Supabase user aktif dan `db:seed` sudah dijalankan |
| `localStorage quota exceeded` | Hapus data lama atau kurangi cache |
| `ERR_MODULE_NOT_FOUND` backend | Jalankan `npx prisma generate` dulu |
| Login gagal setelah seed | Jalankan `cd backend && npm run db:seed` untuk reset data demo |
| Docker `connection refused` | Pastikan PostgreSQL sudah siap sebelum API start (healthcheck) |
