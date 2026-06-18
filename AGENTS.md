# AGENTS.md — EduAdmin Bimbel

## Agent Workflow

This project uses **agent-driven skill workflows**. Skills are located in the `skills/` directory (development tooling, gitignored for production).

### Skill Discovery & Usage

Before acting on any request, check `skills/` for an applicable `SKILL.md`.

If a skill applies, you **MUST** invoke the `skill` tool and follow it exactly. Do not skip steps.

### Core Behaviors

1. **Surface assumptions** — before implementing non-trivial work, state assumptions explicitly and confirm.
2. **Manage confusion** — stop, name the confusion, present tradeoffs, wait for resolution.
3. **Enforce simplicity** — prefer boring, obvious solutions. If 100 lines suffices, do not write 1000.
4. **Maintain scope** — surgical precision only. No unsolicited refactoring or cleanup.
5. **Verify, don't assume** — a task is not complete until there is evidence (passing tests, build output, runtime data).

---

## Token Efficiency Protocol

### Context Budgeting by Task Type

Apply minimal context loading based on task complexity:

| Task Type | Context Strategy | Max Files to Read | Tool Preference |
|-----------|------------------|-------------------|-----------------|
| **Typo/formatting fix** | Read target file only | 1 | Direct `read` |
| **Simple bug fix** | Read error file + 1 related | 2-3 | Direct `read` |
| **Feature addition** | Read target + 1 similar pattern | 3-5 | Direct `read` → `grep` if needed |
| **API endpoint** | Schema + middleware + 1 example | 4-6 | `read` schema first, then examples |
| **Integration work** | Both sides + contract/types | 5-8 | `grep` for interface, then `read` |
| **Bug investigation** | Start narrow, expand if needed | Start 2, max 10 | `grep` error → `read` suspects |
| **Architecture review** | Delegate to subagent | N/A | `task` tool (explore agent) |
| **Refactoring** | Use AST mapper skill first | N/A | `skill` ask-ast-mapper |

### Pre-Flight Checklist (Before Reading Files)

**STOP and ask:**
1. Do I know the exact file path? → Use `read` directly
2. Do I need to search first? → Use `grep`/`glob`, not bulk reads
3. Is this architectural? → Use `task` tool with `explore` agent
4. Can I infer from AGENTS.md? → Check Architecture/Gotchas sections first

### Hot Files (High Reuse Value)

Read these first when working in their domain:

**Auth & Security:**
- `backend/src/middleware/rbac.ts` — role-based access control
- `backend/src/middleware/auth.ts` — JWT verification
- `src/contexts/AuthContext.tsx` — frontend auth state
- `backend/src/routes/auth.ts` — login/register/refresh

**Data Model:**
- `backend/prisma/schema.prisma` — single source of truth for DB schema
- `src/types.ts` — frontend TypeScript types
- `backend/src/types/` — backend types (if exists)

**Core Infrastructure:**
- `backend/src/index.ts` — Express app setup, middleware chain
- `src/api/client.ts` — frontend API client (token refresh logic)
- `src/main.tsx` — React entry point

**Validation:**
- `backend/src/schemas/` — Zod validation schemas (organized by entity)
- `src/utils/validation.ts` — frontend validation helpers

### Cold Files (Read Only When Explicitly Needed)

Avoid reading unless task directly involves them:

- `src/data/mockData.ts` — fallback data (legacy)
- `backend/prisma/migrations/*` — historical, read schema instead
- `backend/prisma/seed.ts` — demo data setup
- `src/test/**` — test files (unless fixing tests)
- `*.md` files (except AGENTS.md for context)
- Config files (`vite.config.ts`, `tsconfig.json`) — only when debugging build

### Role-Based Agent Activation

**When to act immediately:**
- User explicitly requests an action ("fix", "add", "update", "delete")
- Bug with clear error message + file reference
- Verification tasks (lint, test, typecheck)

**When to confirm first:**
- Task spans >5 files
- Breaking changes (API contracts, DB schema)
- Ambiguous requirements ("improve", "optimize" without metrics)
- Production operations (deploy, migrate)

**When to delegate to subagent:**
- "Find all X in the codebase" → `task` explore
- "How does Y work?" (without file reference) → `task` explore
- Architecture analysis → `skill` architecture-designer
- Security audit → `skill` ask-owasp-security-review

### Efficient Search Patterns

**Before using `grep`:**
1. Check if AGENTS.md already documents it (API endpoints, file structure)
2. Use specific patterns: `grep "class UserService"` not `grep "user"`
3. Limit scope: `--include="*.ts"` not all files

**Before using `glob`:**
1. Use precise patterns: `src/components/Login*.tsx` not `**/*.tsx`
2. Avoid globbing when you know the path

**Before using `task` explore:**
1. Try direct `grep` + `read` first (2-3 files)
2. Use explore only for true discovery (>5 potential files)

### Context Preservation Rules

**Do not re-read:**
- Files already in conversation context (check prior messages)
- Files you just wrote/edited (you know the content)
- Schema after initial read (reference from memory)

**Do summarize instead of quoting:**
- Long type definitions (state the shape, not full code)
- Enum values (list options, not full declaration)
- Test files (describe coverage, not full test code)

### Emergency Brake

**If you've read >15 files and haven't started implementation:**
1. STOP
2. Summarize findings in 3-5 bullets
3. Ask user: "Found X. Should I proceed with Y approach, or do you need different direction?"

---

## Agent Routing (OpenCode Manager)

OpenCode bertindak sebagai **manager agent**. Berdasarkan deskripsi tugas, ia otomatis mendelegasikan ke sub-agent yang tepat:

| Sub-Agent | Dipanggil Saat | Model (provider) |
|-----------|----------------|------------------|
| `explorer` | Cari file, search code, baca file | GPT 5.4 Nano (opencode) |
| `backend` | API routes, Prisma, DB, migration, validation | Qwen3 → Groq → OpenRouter → Gemini (9router) |
| `frontend` | React components, UI, styling, auth context | Qwen3 → Groq → OpenRouter → Gemini (9router) |
| `tester` | Unit/E2E test, coverage, mocking | Claude 4.5 → Groq → OpenRouter → Gemini (9router) |
| `security` | Auth audit, RBAC, XSS/SQLi, secrets scan | Claude 4.5 → Groq → OpenRouter → Gemini (9router) |

**Sub-agent fallback:** 4-layer fallback via 9router combo: Kiro → Groq → OpenRouter → Gemini. Setiap provider auto-fallback ke provider berikutnya saat rate limit / error.

**Free providers:** OpenCode (built-in, no auth) + Kiro AI (OAuth) + Groq (30 RPM) + OpenRouter (27+ free models, 200 req/day) + Gemini 2.5 Flash (1M ctx, free tier). Semua tanpa kartu kredit.

**Override manual:** `/model` bisa ganti model kapan saja.

---

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
| `cd backend && npm run db:seed` | Run Prisma seed (demo data) |
| `cd backend && npm run db:migrate` | Create migration (dev) |
| `cd backend && npm run db:migrate:deploy` | Apply migration (prod) |
| `cd backend && npm run db:migrate:reset` | Reset + re-migrate (dev) |
| `cd backend && npm run db:push` | Sync schema langsung (dev, risk data loss) |
| `cd backend && npm run generate` | Regenerate Prisma Client |
| `cd backend && npx prisma studio` | Open Prisma Studio GUI |
| `cd backend && npx tsc --noEmit` | Backend type-check |
| `cd backend && npm run test` | Backend unit tests (Vitest, 23 tests) |
| `cd backend && npm run test:watch` | Backend vitest watch mode |
| `cd backend && npm run test:coverage` | Backend test coverage |
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
3. `cd backend && npx prisma db push && npm run db:seed`
4. `cd .. && npm run dev` (frontend) + `cd backend && npm run dev` (backend)

### Production deploy

1. `cd backend && npm run db:migrate:deploy && npm run db:seed`
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
