# EduAdmin Bimbel — Sistem Manajemen Les Terpadu

Full-stack aplikasi manajemen bimbingan belajar dengan React 19 SPA (frontend) + Express 5 + Prisma + PostgreSQL (backend). Mencakup manajemen siswa, guru, SPP/keuangan, modul belajar, kuis interaktif, absensi QR/GPS, jadwal, notifikasi, dan kontrol akses berbasis peran (RBAC).

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React 19, TypeScript 5.8 (strict), Vite 6, Tailwind CSS v4, Recharts, Lucide React |
| **Backend** | Express 5, TypeScript, Prisma ORM, PostgreSQL, Zod (validation) |
| **Auth** | JWT (access + refresh token), bcrypt password hashing |
| **Testing** | Vitest + Testing Library (frontend) |
| **Infrastructure** | Docker, Docker Compose, GitHub Actions CI/CD |
| **Monitoring** | Sentry (frontend + backend, opsional via env) |

### Statistik Proyek

| Metrik | Angka |
|--------|-------|
| Total frontend source files | 39 file (4.488 baris) |
| Total backend source files | 20 file (863 baris) |
| Prisma models (tables) | 15 model |
| API routes | 7 route files |
| Unit tests | 10 file (85 test cases) |
| Dependencies (frontend) | 9 runtime + 12 dev |
| Dependencies (backend) | 8 runtime + 8 dev |
| Total git commits | 10 |

---

## Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vite :3000)                 │
│                                                         │
│  AuthProvider ─► App ─► DataProvider ─► DashboardShell  │
│                    │                    │                │
│               LoginPage           6 Panel Components    │
│                                        │                │
│                               Ringkasan, Siswa, SPP,    │
│                               Pengajar, Modul, HakAkses │
└──────────────────────────┬──────────────────────────────┘
                           │ Proxy /api
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Backend (Express :3001)                      │
│                                                          │
│  Middleware: helmet, cors, auth (JWT), rbac, validate   │
│                                                          │
│  Routes: /auth, /students, /teachers, /finance,          │
│          /materials, /notifications, /schedules          │
│                                                          │
│  Utils: password (bcrypt), jwt, audit log                │
└──────────────────────┬───────────────────────────────────┘
                       │ Prisma ORM
                       ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL (:5432)                           │
│  15 tables: users, students, teachers, transactions,     │
│  attendances, schedules, materials, quizzes,             │
│  notifications, audit_logs, dll.                         │
└─────────────────────────────────────────────────────────┘
```

### Aliran Data

1. **Login:** Frontend → POST `/api/auth/login` → JWT tokens disimpan di localStorage
2. **CRUD:** Setiap panel memanggil REST API dengan Bearer token
3. **Offline Fallback:** Data disimpan di localStorage (terenkripsi) sebagai cache
4. **Auto-refresh:** Jika 401, access token di-refresh otomatis via `/api/auth/refresh`
5. **Audit:** Semua mutasi tercatat di tabel `audit_logs` dengan actor + action + entity

---

## Struktur Proyek

```
.
├── Dockerfile                     # Multi-stage build frontend
├── docker-compose.yml             # PostgreSQL + API + Frontend
├── .github/workflows/ci.yml       # CI/CD pipeline
├── index.html                     # Vite entry
├── vite.config.ts                 # Vite + proxy /api → :3001
├── tsconfig.json                  # TypeScript strict mode
├── eslint.config.js               # ESLint flat config
├── package.json                   # Frontend dependencies
│
├── src/                           # Frontend source
│   ├── main.tsx                   # Entry → AuthProvider
│   ├── App.tsx                    # Auth guard + DataProvider
│   ├── types.ts                   # TypeScript interfaces
│   ├── index.css                  # Tailwind CSS v4
│   │
│   ├── api/
│   │   └── client.ts              # HTTP client + typed API methods
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx         # JWT auth state + login/logout
│   │   └── DataContext.tsx         # Central state management
│   │   └── SiswaPanelContext.tsx   # Siswa panel context
│   │
│   ├── hooks/
│   │   ├── usePersistedState.ts   # Encrypted localStorage hook
│   │   ├── useApiData.ts          # API fetch + cache hook
│   │   ├── useSync.ts             # Offline sync state
│   │   └── useToast.ts            # Toast notifications
│   │
│   ├── components/
│   │   ├── Sidebar.tsx            # Navigation + role (from JWT)
│   │   ├── Header.tsx             # Action bar
│   │   ├── LoginPage.tsx          # Login form
│   │   ├── RingkasanPanel.tsx     # Dashboard + analytics
│   │   ├── SiswaPanel.tsx         # Student QR & GPS
│   │   ├── PengajarPanel.tsx      # Teacher evaluation
│   │   ├── SppPanel.tsx           # Finance & operational costs
│   │   ├── ModulPanel.tsx         # Materials & quizzes
│   │   ├── HakAksesPanel.tsx      # RBAC matrix table
│   │   ├── StatsStrip.tsx         # Summary stats bar
│   │   ├── Toast.tsx              # Toast notification UI
│   │   ├── ErrorBoundary.tsx      # Error boundary
│   │   └── AvatarWithFallback.tsx # Avatar component
│   │
│   ├── data/
│   │   └── mockData.ts            # Initial seed data (fallback)
│   │
│   ├── utils/
│   │   ├── crypto.ts              # AES-GCM encryption
│   │   └── validation.ts          # Pure utility functions
│   │
│   └── test/                      # Unit tests (85 cases)
│       ├── validation.test.ts
│       ├── usePersistedState.test.ts
│       ├── AuthContext.test.tsx
│       ├── client.test.ts
│       ├── ErrorBoundary.test.tsx
│       ├── LoginPage.test.tsx
│       ├── SppPanel.test.tsx
│       ├── StatsStrip.test.tsx
│       └── Toast.test.tsx
│
└── backend/                       # Backend source
    ├── Dockerfile                 # Multi-stage build
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    │
    ├── prisma/
    │   ├── schema.prisma          # 15 models + indexes
    │   └── seed.ts                # Demo data seeder
    │
    └── src/
        ├── server.ts              # Entry point
        ├── app.ts                 # Express app setup
        │
        ├── routes/
        │   ├── auth.ts            # Register, login, refresh, me
        │   ├── students.ts        # CRUD, toggle SPP, checkin
        │   ├── teachers.ts        # List, evaluate
        │   ├── finance.ts         # Transactions, summary
        │   ├── materials.ts       # CRUD, download count
        │   ├── notifications.ts   # List, SPP/exam reminders
        │   └── schedules.ts       # List schedules
        │
        ├── middleware/
        │   ├── auth.ts            # JWT verification
        │   ├── rbac.ts            # Role-based access control
        │   ├── validate.ts        # Zod schema validation
        │   ├── errorHandler.ts    # Global error handler
        │   └── sentry.ts          # Sentry initialization
        │
        ├── utils/
        │   ├── jwt.ts             # Sign + verify tokens
        │   ├── password.ts        # bcrypt hash + compare
        │   └── audit.ts           # Audit log helper
        │
        └── types/
            └── index.ts           # JwtPayload, AuthRequest
```

---

## Setup Development

### Prasyarat

- Node.js 22+
- PostgreSQL 16+ (atau Docker)
- npm

### 1. Clone & Install

```bash
git clone <repo-url>
cd Bimbel_ET.10

# Install frontend
npm install

# Install backend
cd backend && npm install && cd ..
```

### 2. Konfigurasi Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env sesuai kebutuhan (database URL, JWT secret, dll.)

# Frontend (opsional, default sudah work)
cp .env.example .env
```

### 3. Database

```bash
# Setup database
cd backend
npx prisma db push    # Sync schema ke PostgreSQL
npm run db:seed        # Seed data demo
cd ..
```

### 4. Jalankan Development

```bash
# Terminal 1 — Backend
cd backend && npm run dev
# → API running on http://localhost:3001

# Terminal 2 — Frontend
npm run dev
# → App running on http://localhost:3000
```

### 5. Login

Buka `http://localhost:3000` dan login dengan:

| Email | Password | Role |
|-------|----------|------|
| `admin@bimbel.edu` | `admin123` | ADMIN |
| `guru@bimbel.edu` | `guru123` | GURU |
| `siswa@bimbel.edu` | `siswa123` | SISWA |

---

## Docker Setup

### Build & Jalankan Semua Service

```bash
docker compose up --build
```

Services:
- **PostgreSQL** (:5432) — database
- **API** (:3001) — Express backend
- **Frontend** (:3000) — Vite preview production build

### Perintah Docker Lainnya

```bash
docker compose down          # Stop containers
docker compose down -v       # Stop + hapus volume
docker compose logs -f       # Streaming logs
```

---

## API Endpoints

| Route | Methods | Auth | RBAC | Description |
|-------|---------|------|------|-------------|
| `/api/health` | GET | - | - | Health check |
| `/api/auth/register` | POST | - | - | Register user |
| `/api/auth/login` | POST | - | - | Login → JWT |
| `/api/auth/refresh` | POST | - | - | Refresh token |
| `/api/auth/me` | POST | ✓ | - | Current user info |
| `/api/students` | GET, POST | ✓ | POST: ADMIN/GURU | List / create students |
| `/api/students/:id` | GET | ✓ | - | Single student detail |
| `/api/students/:id/toggle-spp` | PUT | ✓ | ADMIN | Toggle SPP status |
| `/api/students/:id/checkin` | PUT | ✓ | ADMIN/GURU | Record attendance |
| `/api/teachers` | GET | ✓ | - | List teachers |
| `/api/teachers/evaluate/:id` | POST | ✓ | ADMIN | Evaluate teacher |
| `/api/finance/transactions` | GET | ✓ | - | List transactions |
| `/api/finance/summary` | GET | ✓ | - | SPP summary + costs |
| `/api/finance/students/:id/transactions` | GET | ✓ | ADMIN/FINANCE | Student transactions |
| `/api/materials` | GET, POST | ✓ | POST: ADMIN/GURU | List / create materials |
| `/api/materials/:id/download` | PUT | ✓ | - | Increment download |
| `/api/notifications` | GET | ✓ | - | List notifications |
| `/api/notifications/spp-reminder` | POST | ✓ | ADMIN | Broadcast SPP reminder |
| `/api/notifications/exam-reminder` | POST | ✓ | ADMIN | Broadcast exam reminder |
| `/api/schedules` | GET | ✓ | - | List schedules |

---

## Database Schema (15 Models)

| Model | Key Fields | Indexes |
|-------|-----------|---------|
| `User` | id, email (unique), password, name, role (enum) | email, role, active |
| `RefreshToken` | id, token (unique), userId (FK), expiresAt | userId, expiresAt |
| `Student` | id, name, classLevel, email (unique), sppStatus, sppAmount, qrCodeData | name, email, classLevel, sppStatus, active, (sppStatus,active) |
| `SubjectScore` | id, studentId (FK), name, score | studentId |
| `ProgressHistory` | id, studentId (FK), month, score, attendance | studentId |
| `Attendance` | id, studentId (FK), date, status, method | studentId, date, (studentId,date) |
| `Transaction` | id, studentId (FK), amount, type, date | studentId, type, date, (studentId,type,date) |
| `Teacher` | id, name, email (unique), subjects[], rating | email, active, rating |
| `Evaluation` | id, teacherId (FK), date, pedagogical, professional, social, feedback | teacherId, date |
| `Schedule` | id, teacherId (FK), classTitle, startTime, endTime, status | teacherId, status |
| `Material` | id, title, subject, type, isLocked | subject, active, isLocked, (subject,active) |
| `InteractiveQuiz` | id, title, subject | - |
| `QuizQuestion` | id, quizId (FK), text, options[], correctIndex | quizId |
| `Notification` | id, userId (FK), title, message, type, targetRole, read | userId, targetRole, read, timestamp |
| `AuditLog` | id, userId (FK), action, entity, entityId | userId, action, entity, createdAt, (entity,entityId) |

---

## Authentication & RBAC

### Alur Autentikasi

1. Login → backend mengembalikan `accessToken` (15 menit) + `refreshToken` (7 hari)
2. Token disimpan di localStorage, dikirim via header `Authorization: Bearer <token>`
3. Saat 401, frontend auto-refresh via `/api/auth/refresh`
4. Logout → hapus token dari localStorage + sessionStorage (crypto key)

### Role-Based Access Control

RBAC di-enforce di **dua lapisan**:

| Lapisan | Implementasi |
|---------|-------------|
| **Server** | Middleware `requireRole()` di setiap route backend |
| **Client** | Sidebar menampilkan role dari JWT (tidak bisa dimanipulasi user) |

Roles: `SUPER_ADMIN` | `ADMIN` | `FINANCE` | `GURU` | `SISWA` | `WALI_MURID`

### Matriks Akses

| Fitur | ADMIN | GURU | WALI MURID | SISWA |
|-------|-------|------|------------|-------|
| Kelola siswa | ✓ | ✓ | ✗ | ✗ |
| Presensi (QR/GPS) | ✓ | ✓ | ✗ | ✗ |
| Status SPP | ✓ | ✗ | Lihat | ✗ |
| Evaluasi guru | ✓ | ✗ | ✗ | ✗ |
| Unggah materi | ✓ | ✓ | ✗ | ✗ |
| Download materi | ✓ | ✓ | ✗ | Terbatas |
| Kuis interaktif | ✓ | ✓ | ✗ | ✓ |
| Lihat notifikasi | Semua | Semua | Personal | Personal |
| Manajemen user | ✓ | ✗ | ✗ | ✗ |

---

## Security Features

| Feature | Detail |
|---------|--------|
| **Enkripsi localStorage** | AES-GCM (Web Crypto API) + XOR fallback — kunci di sessionStorage |
| **CSV Injection** | Sanitasi prefix `=`, `+`, `-`, `@` sebelum ekspor |
| **Rate Limiting** | Client-side 500ms cooldown, 300ms untuk checkin |
| **JWT Auto-Refresh** | Transparent token refresh on 401 |
| **CORS Hardening** | Multi-origin support, wildcard warning di production |
| **Helmet** | HTTP security headers (CSP disabled for API) |
| **Input Validation** | Zod schemas di semua POST/PUT endpoints |
| **Audit Trail** | Semua mutasi tercatat di tabel `audit_logs` |
| **Error Boundary** | Client-side error isolation per panel |
| **Sentry** | Error tracking (aktif jika `SENTRY_DSN` di-set) |

---

## Testing

### Frontend

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

Cakupan test:
- **validation.test.ts** — 7 test suites, validasi email, CSV, filter, quiz score
- **usePersistedState.test.ts** — localStorage read/write/sync
- **AuthContext.test.tsx** — Login flow, token management
- **client.test.ts** — API request/refresh logic
- **ErrorBoundary.test.tsx** — Error catching
- **LoginPage.test.tsx** — Login form interaction
- **SppPanel.test.tsx** — Financial data rendering
- **StatsStrip.test.tsx** — Stats summary rendering
- **Toast.test.tsx** — Toast notification behavior

### Backend (manual)

```bash
cd backend
npx tsc --noEmit       # Type check
npx prisma validate    # Schema validation
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

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3001/api` | Backend API URL |
| `VITE_SENTRY_DSN` | - | Sentry DSN (opsional) |
| `VITE_GPS_LAT` | `-6.2088` | Default latitude (Jakarta) |
| `VITE_GPS_LON` | `106.8456` | Default longitude (Jakarta) |

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | - | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | (dev default) | Secret untuk access token |
| `JWT_REFRESH_SECRET` | (dev default) | Secret untuk refresh token |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed origin(s), comma-separated |
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `SENTRY_DSN` | - | Sentry DSN (opsional) |

---

## Panel Aplikasi

| Panel | Fitur Utama |
|-------|-------------|
| **Ringkasan** | Grafik performa, notifikasi real-time, detail siswa per-individu |
| **Siswa** | Daftar siswa, QR presensi, GPS check-in, filter/search |
| **Pengajar** | Jadwal mengajar, evaluasi performa (pedagogik, profesional, sosial) |
| **SPP** | Biaya operasional transparan, buku besar transaksi |
| **Modul** | Repository materi, upload, download counter, kuis interaktif |
| **Hak Akses** | Matriks RBAC tabel untuk semua role |

---

## Panduan Deployment

### Production (Manual)

```bash
# Build frontend
npm run build

# Build backend
cd backend && npm run build && cd ..

# Jalankan dengan PM2 / systemd
cd backend && NODE_ENV=production node dist/server.js

# Serve frontend dengan nginx/caddy/serve
npx serve dist -l 3000
```

### Production (Docker)

```bash
# Set environment variables
export CORS_ORIGIN=https://yourdomain.com
export JWT_ACCESS_SECRET=<random-string>
export JWT_REFRESH_SECRET=<another-random-string>
export SENTRY_DSN=<your-sentry-dsn>  # optional

# Build & run
docker compose up --build -d
```

### Production (Docker + Reverse Proxy)

Recommended: letakkan Nginx/Caddy/Traefik di depan untuk:
- SSL/TLS termination
- Static file serving untuk frontend
- Rate limiting
- WAF protection

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `PrismaClientInitializationError` | Pastikan PostgreSQL running dan `DATABASE_URL` benar |
| `JWT_SECRET not set` | Set `JWT_ACCESS_SECRET` dan `JWT_REFRESH_SECRET` di `.env` |
| CORS error | Set `CORS_ORIGIN` sesuai domain frontend |
| `localStorage quota exceeded` | Hapus data lama atau kurangi cache |
| `ERR_MODULE_NOT_FOUND` backend | Jalankan `npx prisma generate` dulu |
| Login gagal | Jalankan `npm run db:seed` untuk reset data demo |

---

## Lisensi

Proyek internal — EduAdmin Bimbel.
