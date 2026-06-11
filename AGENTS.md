# AGENTS.md — EduAdmin Bimbel

## Project

Full-stack tutoring management: React 19 SPA (frontend) + Express 5 + Prisma + PostgreSQL (backend). Docker-ready with GitHub Actions CI.

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Vite dev server on `http://0.0.0.0:3000` (proxies `/api` → `localhost:3001`) |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | TypeScript type-check (`tsc --noEmit`, strict mode) |
| `npm run lint:eslint` | ESLint check on `src/` |
| `npm run test` | Vitest unit tests (excludes `e2e/` and `backend/`) |
| `npm run test:watch` | Vitest watch mode |
| `npm run preview` | Vite preview of built output |
| `npm run clean` | Remove `dist/` |

### Backend commands (`backend/`)

| Command | What it does |
|---------|-------------|
| `cd backend && npm run dev` | Start dev server (tsx watch) on `:3001` |
| `cd backend && npm run build` | Compile TS → JS to `dist/` |
| `cd backend && npm start` | Run compiled server |
| `cd backend && npm run seed` | Run Prisma seed (demo data) |
| `cd backend && npm run db:migrate` | Create migration (dev) |
| `cd backend && npm run db:migrate:deploy` | Apply migration (prod) |
| `cd backend && npm run db:migrate:reset` | Reset + re-migrate (dev) |
| `cd backend && npm run db:push` | Sync schema langsung (dev, risk data loss) |
| `cd backend && npm run generate` | Regenerate Prisma Client |
| `cd backend && npx prisma studio` | Open Prisma Studio GUI |
| `cd backend && npx tsc --noEmit` | Backend type-check |
| `psql postgresql://postgres:postgres@localhost:54322/postgres -f backend/prisma/scripts/cleanup-audit-logs.sql` | Hapus audit logs > 90 hari |

### Docker

| Command | What it does |
|---------|-------------|
| `docker compose up --build` | Start postgres + api (port 3001) + frontend (port 3000) |
| `docker compose down` | Stop containers |
| `docker compose down -v` | Stop + delete volumes |

## Setup

1. `npm install && cd backend && npm install`
2. Copy `backend/.env.example` → `backend/.env`
3. `cd backend && npx prisma db push && npm run seed`
4. `cd .. && npm run dev` (frontend) + `cd backend && npm run dev` (backend)

### Production deploy

1. `cd backend && npm run db:migrate:deploy && npm run seed`
2. `cd .. && npm run build`

## Architecture

### Frontend (`src/`)

- **Entry:** `src/main.tsx` → renders `<App />` wrapped in `<AuthProvider>`
- **State-driven routing:** No react-router; `activeTab` state switches between 6 panels: `ringkasan`, `siswa`, `pengajar`, `spp`, `modul`, `hak_akses`
- **Code splitting:** All 6 panels lazy-loaded via `React.lazy()` + `<Suspense>`
- **Auth:** `AuthContext` + `LoginPage` — unauthenticated users see login form
- **API client:** `src/api/client.ts` — auto-refresh token, typed responses, error handling
- **Components:** `src/components/` (12 files — added `LoginPage.tsx`)
- **Sentry:** `src/lib/sentry.ts` — initialized when `VITE_SENTRY_DSN` is set
- **Utils:** `src/utils/validation.ts` — pure functions for validation, filtering, CSV safety
- **Mock data:** `src/data/mockData.ts` (still used as fallback)
- **Types:** `src/types.ts` + `src/contexts/AuthContext.tsx` (`AuthUser`)
- **Tests:** `src/test/` — Vitest (66 tests)

### Backend (`backend/`)

- **Framework:** Express 5 + TypeScript (tsx watch for dev)
- **ORM:** Prisma 6 with PostgreSQL (schema: `backend/prisma/schema.prisma`)
- **Auth:** Supabase Auth (JWT verification via `supabaseAdmin.auth.getUser()`)
- **RBAC:** Middleware checks `user.role` (SUPER_ADMIN, ADMIN, FINANCE, GURU, SISWA)
- **Validation:** Zod schemas on all POST/PUT endpoints
- **Audit:** All mutations logged to `audit_logs` table with typed enum (AuditAction/AuditEntity)
- **Sentry:** `backend/src/middleware/sentry.ts` — initialized when `SENTRY_DSN` is set
- **Database tables:** users, students (+ subject_scores, progress_history), teachers (+ evaluations), schedules, attendances, transactions, materials, interactive_quizzes (+ quiz_questions), notifications, refresh_tokens, audit_logs
- **Database enums:** UserRole, SppStatus, TransactionType, TransactionStatus, AttendanceStatus, AttendanceMethod, ScheduleStatus, MaterialType, NotificationType, AuditAction, AuditEntity
- **Migrations:** Prisma Migrate (`prisma/migrations/0001_initial_production_schema`)
- **Connection pooling:** `directUrl` configured for PgBouncer production support

### API Endpoints

| Route | Methods | Auth | Description |
|-------|---------|------|-------------|
| `/api/auth/register` | POST | No | Register new user |
| `/api/auth/login` | POST | No | Login → JWT tokens |
| `/api/auth/refresh` | POST | No | Refresh access token |
| `/api/auth/me` | GET | Yes | Current user info |
| `/api/students` | GET, POST | Yes | List / create students |
| `/api/students/:id` | GET, PUT, DELETE | Yes | CRUD single student |
| `/api/teachers` | GET, POST | Yes | List / create teachers |
| `/api/teachers/:id` | GET, PUT, DELETE | Yes | CRUD single teacher |
| `/api/finance` | GET, POST | Yes | List / create transactions |
| `/api/finance/:id` | GET, PUT, DELETE | Yes | CRUD single transaction |
| `/api/materials` | GET, POST | Yes | List / create materials |
| `/api/materials/:id` | GET, PUT, DELETE | Yes | CRUD single material |
| `/api/notifications` | GET, POST | Yes | List / create notifications |
| `/api/notifications/:id` | PUT, DELETE | Yes | Read / delete notification |
| `/api/schedules` | GET | Yes | List schedules |

## Config

- `tsconfig.json` has **`strict: true`** — TypeScript strict mode enabled
- `eslint.config.js` — ESLint flat config with TypeScript rules
- No path aliases configured — imports use relative paths
- Tailwind CSS v4 via `@tailwindcss/vite` plugin (not PostCSS config)
- HMR can be disabled: `DISABLE_HMR=true npm run dev`
- Build output is `dist/` (gitignored)

## Gotchas

- Division by zero: `totalSPPExpected` could be 0 (guarded with `> 0` check); `calculateQuizScore` guards empty questions
- Form `required` attributes are bypassed by `e.preventDefault()` — use manual validation
- User name from `authUser.name` (from JWT session, not hardcoded)
- Server RBAC is enforced via middleware (`backend/src/middleware/rbac.ts`)
- Frontend role selector in sidebar is for demo only — real roles come from JWT
- Frontend still uses localStorage as fallback (panels not yet migrated to API calls)
- Rate limiting on mutation handlers (500ms cooldown, 300ms for checkin)
- No loading/empty/error states for async operations (except GPS)
- `metadata.json` has empty `majorCapabilities` (Gemini claim removed)
- Backend uses Zod v4 (latest) — `z.string()` etc still work the same
- Default demo credentials: `admin@bimbel.edu` / `admin123`
- GPS_DEFAULT is configurable via `VITE_GPS_LAT` / `VITE_GPS_LON` env vars
- ErrorBoundary `localStorage.clear()` hanya menghapus key `edu_*` prefix
- Sidebar has logout button that clears session tokens
