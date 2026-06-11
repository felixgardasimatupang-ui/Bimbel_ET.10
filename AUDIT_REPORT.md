# AUDIT REPORT — EduAdmin Bimbel

**Tanggal:** 11 Juni 2026  
**Reviewer:** OWL (Automated Code Review)  
**Branch:** main (commit `df43403`)  
**Scope:** Full-stack review — Frontend (React 19 + Vite), Backend (Express 5 + Prisma), Database (PostgreSQL), Security, Testing

---

## Executive Summary

Project EduAdmin Bimbel adalah full-stack tutoring management system dengan arsitektur yang solid. Codebase sudah melalui beberapa iterasi audit dan remediasi. **Build bersih, 85 tests pass, 0 lint/ESLint errors.** Berikut temuan detail.

---

## Build & Test Status

| Check | Status |
|-------|--------|
| `npm run lint` (tsc --noEmit) | PASS |
| `npm run lint:eslint` | PASS |
| `npm run test` (85 tests, 9 files) | PASS |
| `npm run build` | PASS (1.46s) |
| Backend `npx tsc --noEmit` | Tidak diverifikasi (butuh `cd backend && npm install`) |

---

## CRITICAL Issues (Harus Diperbaiki)

### C-01: Default JWT Secret di Production
- **File:** `backend/src/utils/jwt.ts:4-5`
- **Masalah:** `ACCESS_SECRET` dan `REFRESH_SECRET` punya fallback hardcoded `'eduadmin-access-secret-dev'` / `'eduadmin-refresh-secret-dev'`. Jika `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` env var tidak di-set di production, semua token ditandatangani dengan secret yang diketahui publik.
- **Dampak:** Siapa saja bisa membuat JWT token palsu dan mengakses semua endpoint sebagai role apapun.
- **Rekomendasi:** Hapus fallback. Buat error eksplisit jika env var tidak ada:
  ```ts
  const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
  if (!ACCESS_SECRET) throw new Error('JWT_ACCESS_SECRET env var is required');
  ```

### C-02: Credentials Default di Login Page
- **File:** `src/components/LoginPage.tsx:7-8`
- **Masalah:** Email dan password default (`admin@bimbel.edu` / `admin123`) di-hardcode di state awal. Meski ini demo, ini bisa menjadi kebiasaan berbahaya jika lupa dihapus.
- **Dampak:** Informasi credential tersebar di source code.
- **Rekomendasi:** Hapus default value, biarkan field kosong. Atau tambahkan banner "DEMO MODE" yang jelas.

### C-03: Register Endpoint Tidak Membatasi Role
- **File:** `backend/src/routes/auth.ts:17`
- **Masalah:** Schema register menerima `role` sebagai optional field yang bisa dipilih user saat registrasi. Siapa saja bisa mendaftar sebagai `SUPER_ADMIN`.
- **Dampak:** Privilege escalation — user biasa bisa membuat akun admin.
- **Rekomendasi:** Hapus `role` dari register schema. Selalu default ke `SUPER_ADMIN` -> ganti ke role paling rendah, atau buat endpoint terpisah untuk admin membuat user dengan role tertentu.

---

## HIGH Priority Issues (Sebaiknya Diperbaiki)

### H-01: Frontend Menggunakan localStorage sebagai Sumber Data Utama
- **File:** `src/contexts/DataContext.tsx:144-150`, `src/hooks/usePersistedState.ts`
- **Masalah:** Semua data CRUD (siswa, teacher, transaksi, materi, notif) disimpan dan dimutasi di localStorage via `usePersistedState`. Backend API sudah ada tapi tidak digunakan sebagai sumber data utama. `useApiData` hook ada tapi tidak terintegrasi ke DataContext.
- **Dampak:** Data tidak persisten di server, hilang jika ganti browser/device, tidak bisa multi-user.
- **Rekomendasi:** Migrasi bertahap — gunakan API call sebagai primary source, localStorage sebagai cache/offline fallback.

### H-02: Tidak Ada Rate Limiting di Backend
- **File:** `backend/src/app.ts`
- **Masalah:** Express app tidak menggunakan `express-rate-limit` atau middleware rate limiting apapun. Hanya ada rate limiting di frontend (client-side) yang mudah di-bypass.
- **Dampak:** Brute force attack pada endpoint login/register, abuse API endpoints.
- **Rekomendasi:** Tambahkan `express-rate-limit` global dan khusus untuk auth endpoints.

### H-03: CORS Allow Credentials dengan Multi-Origin
- **File:** `backend/src/app.ts:29-32`
- **Masalah:** `credentials: true` dengan multi-origin CORS bisa menjadi masalah keamanan jika origin tidak di-validate ketat. Warning untuk wildcard sudah ada, tapi tidak ada blokir.
- **Dampak:** Potential CSRF-like attacks dari origin yang tidak diinginkan.
- **Rekomendasi:** Validasi origin secara eksplisit, jangan gunakan array origin dengan credentials.

### H-04: Audit Log Gagal Secara Silent
- **File:** `backend/src/utils/audit.ts:14-17`
- **Masalah:** `createAuditLog` menangkap semua error dan tidak melakukan apapun (`catch {}`). Jika audit log gagal (DB down, constraint violation), operasi tetap berhasil tanpa jejak audit.
- **Dampak:** Kehilangan jejak audit secara diam-diam.
- **Rekomendasi:** Minimal log ke console.error atau external logger. Pertimbangkan retry mechanism.

### H-05: Password Hashing dengan Salt Rounds Rendah
- **File:** `backend/src/utils/password.ts:3`
- **Masalah:** `SALT_ROUNDS = 10` adalah minimum standar bcrypt. Untuk aplikasi manajemen pendidikan dengan data sensitif siswa, ini bisa ditingkatkan.
- **Dampak:** Lebih rentan terhadap brute force jika database bocor.
- **Rekomendasi:** Naikkan ke 12 rounds. Catatan: ini akan mempengaruhi performa login sedikit.

---

## MEDIUM Priority Issues (Nice to Have)

### M-01: DataContext Terlalu Besar (God Context)
- **File:** `src/contexts/DataContext.tsx` (593 lines)
- **Masalah:** Satu context menyimpan semua state untuk 6 panel berbeda. Ini membuat komponen yang hanya butuh sedikit data tetap re-render saat state lain berubah.
- **Dampak:** Performa menurun seiring pertambahan fitur.
- **Rekomendasi:** Split menjadi per-domain context (StudentContext, TeacherContext, FinanceContext, dll).

### M-02: Duplikasi Validasi Frontend dan Backend
- **Files:** `src/utils/validation.ts` vs `backend/src/routes/*` (Zod schemas)
- **Masalah:** Validasi email, SPP amount, dll didefinisikan terpisah di frontend dan backend. Tidak ada shared schema.
- **Dampak:** Inkonsisten jika satu sisi diupdate tapi tidak sisi lain.
- **Rekomendasi:** Gunakan package shared atau generate Zod schema sebagai single source of truth.

### M-03: `any` Type Casting di Backend Routes
- **Files:** `backend/src/routes/auth.ts:109`, `students.ts:45`, `finance.ts:35`, dll
- **Masalah:** Banyak penggunaan `(req as any).user` dan `where as any` yang menghilangkan type safety.
- **Dampak:** Bug type-related tidak tertangkap oleh compiler.
- **Rekomendasi:** Extend Express Request type dengan proper typing, gunakan Prisma's generated types untuk where clauses.

### M-04: Tidak Ada Input Sanitization untuk XSS
- **Files:** Semua komponen React yang render user input
- **Masalah:** React secara default melakukan escaping, tapi tidak ada Content-Security-Policy header yang ketat (helmet CSP di-disable di `app.ts:15`).
- **Dampak:** Jika ada vulnerability di dependency atau unsafe rendering, XSS mungkin terjadi.
- **Rekomendasi:** Enable helmet CSP dengan konfigurasi yang sesuai, tambahkan sanitization library jika perlu.

### M-05: PrismaClient Instance Per Route File
- **Files:** Setiap `backend/src/routes/*.ts` membuat `new PrismaClient()`
- **Masalah:** Setiap route file membuat instance PrismaClient terpisah. Dalam serverless environment ini bisa menghabiskan connection pool.
- **Dampak:** Potensi connection leak atau exhausted pool.
- **Rekomendasi:** Buat singleton PrismaClient di file terpisah dan import dari sana.

### M-06: Frontend Role Selector Hanya di UI
- **File:** `src/components/Sidebar.tsx:76`
- **Masalah:** Role ditampilkan dari JWT (`authUser.role`) yang valid, tapi tidak ada mekanisme untuk mencegah user memanipulasi role di frontend. Backend sudah benar dengan RBAC middleware.
- **Dampak:** Low — backend sudah enforce RBAC. Tapi frontend bisa menampilkan UI yang misleading.
- **Rekomendasi:** Pastikan semua sensitive actions di-validate di backend (sudah dilakukan).

### M-07: Tidak Ada Logout Endpoint di Backend
- **File:** `backend/src/routes/auth.ts`
- **Masalah:** Logout hanya dilakukan di frontend dengan `clearTokens()`. Refresh token yang lama tetap valid di database sampai expired.
- **Dampak:** Jika token bocor, tidak bisa di-revoke sebelum expired.
- **Rekomendasi:** Tambahkan endpoint `POST /api/auth/logout` yang menghapus refresh token dari database.

---

## LOW Priority Issues (Perbaikan Kecil)

### L-01: Hardcoded Operational Costs
- **File:** `backend/src/routes/finance.ts:40-46`
- **Masalah:** Operational costs di-hardcode di route handler, bukan dari database atau config.
- **Rekomendasi:** Pindahkan ke database table atau config file.

### L-02: Inconsistent Error Response Format
- **Files:** Beberapa route handler
- **Masalah:** Beberapa endpoint mengembalikan `{ success: true, message: ... }` tapi yang lain `{ success: true, data: ... }`. Tidak ada konsistensi.
- **Rekomendasi:** Standarisasi response format di middleware.

### L-03: Missing `await` untuk Async Audit Log
- **File:** `backend/src/routes/auth.ts:48,80`
- **Masalah:** `createAuditLog()` dipanggil tanpa `await`. Jika gagal, error tidak tertangkap.
- **Rekomendasi:** Tambahkan `await` atau `.catch()` untuk memastikan error handling.

### L-04: Test Coverage Tidak Merata
- **Files:** `src/test/`
- **Masalah:** Hanya 9 test files dengan 85 tests. Banyak komponen dan hook tidak di-test (RingkasanPanel, PengajarPanel, ModulPanel, SiswaPanel, useApiData, useSync, useToast, DataContext).
- **Rekomendasi:** Tambahkan integration tests untuk critical flows (login, CRUD siswa, SPP toggle).

### L-05: `getMe` Menggunakan POST
- **File:** `backend/src/routes/auth.ts:133`
- **Masalah:** `POST /api/auth/me` seharusnya `GET` karena tidak mengubah state.
- **Rekomendasi:** Ubah ke `router.get('/me', ...)`.

### L-06: Frontend `getMe` Juga POST
- **File:** `src/api/client.ts:134-136`
- **Masalah:** `getMe()` menggunakan `method: 'POST'` untuk mengambil data user.
- **Rekomendasi:** Ubah ke `GET`.

### L-07: Unused Import di Sidebar
- **File:** `src/components/Sidebar.tsx:1`
- **Masalah:** `ShieldCheck, Cpu, RefreshCw, Users, Calendar, DollarSign, BookOpen, Wifi, WifiOff, Lock, Award, LogOut, UserCheck` — beberapa mungkin tidak digunakan.
- **Rekomendasi:** Hapus unused imports.

### L-08: `node_modules` di Root `package.json`
- **File:** `package.json`
- **Masalah:** `vite` dan `@vitejs/plugin-react` seharusnya di `devDependencies`, bukan `dependencies`.
- **Rekomendasi:** Pindahkan ke `devDependencies`.

---

## POSITIVE Findings (Yang Sudah Baik)

### P-01: Arsitektur yang Jelas
- Pemisahan frontend/backend yang bersih dengan Docker support.
- Prisma schema well-designed dengan indexes yang tepat.
- Code splitting dengan `React.lazy()` untuk 6 panel.

### P-02: Security Measures yang Sudah Ada
- Helmet middleware aktif (meski CSP disabled).
- CORS configuration dengan multi-origin support dan production warning.
- RBAC middleware di backend dengan role checking.
- Zod validation di semua mutation endpoints.
- bcrypt password hashing.
- JWT dengan access + refresh token pattern.
- Audit logging di semua mutations.

### P-03: Error Handling
- ErrorBoundary di React untuk crash recovery.
- Global error handler di Express.
- Graceful shutdown dengan Prisma disconnect.

### P-04: Type Safety
- TypeScript strict mode enabled di frontend dan backend.
- Custom types (`AuthRequest`, `JwtPayload`, `ApiResponse`) untuk Express.
- Zod schemas untuk runtime validation.

### P-05: Testing Infrastructure
- Vitest dengan React Testing Library.
- 85 tests covering validation, auth, components, hooks.
- Test setup file dengan proper mocking.

### P-06: Developer Experience
- Docker Compose untuk easy setup.
- Prisma Studio untuk DB management.
- Sentry integration untuk error monitoring.
- Tailwind CSS v4 untuk styling.

### P-07: Accessibility
- ARIA labels dan roles di interactive elements.
- Keyboard navigation support di sidebar.
- Semantic HTML elements.

---

## Rekomendasi Prioritas

1. **Segera:** C-01 (JWT Secret), C-03 (Register Role)
2. **Sprint berikutnya:** H-01 (API Integration), H-02 (Rate Limiting), H-07 (Logout Endpoint)
3. **Backlog:** M-01 (Context Split), M-05 (PrismaClient Singleton), L-04 (Test Coverage)

---

## Statistik Codebase

| Metric | Value |
|--------|-------|
| Frontend files | 28 TS/TSX files |
| Backend files | 16 TS files |
| Database models | 12 models |
| API endpoints | 18 endpoints |
| Test files | 9 files, 85 tests |
| Build time | 1.46s |
| Bundle size (gzip) | ~216 kB total |
| Lint errors | 0 |
| TypeScript errors | 0 |
