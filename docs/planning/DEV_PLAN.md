# Development Plan — EduAdmin Bimbel
**Project:** Sistem Manajemen Bimbingan Belajar  
**Tanggal:** 2026-06-15  
**Current Status:** Production-ready, 23 endpoints tested, 99 frontend + 298 backend tests passing

---

## A. Current State (Berdasarkan Dokumentasi & Testing)

### ✅ Features Already Working
| Feature | Implementation | Status |
|---------|---------------|--------|
| Auth JWT (login/register/refresh/me) | `backend/src/routes/auth.ts` | ✅ Full fallback local |
| Manajemen Siswa (CRUD + pagination) | `backend/src/routes/students.ts` | ✅ Full CRUD |
| Manajemen Guru + Evaluasi | `backend/src/routes/teachers.ts` | ✅ Lengkap |
| Keuangan SPP + Biaya Operasional | `backend/src/routes/finance.ts` | ✅ Laporan + summary |
| Modul Belajar (PDF/Video/Tugas) | `backend/src/routes/materials.ts` | ✅ CRUD + download count |
| Notifikasi & Pengingat | `backend/src/routes/notifications.ts` | ✅ SPP/Exam reminder |
| Jadwal Kelas | `backend/src/routes/schedules.ts` | ✅ List + filter |
| Audit Logs Real-time | `backend/src/routes/audit.ts` | ✅ Filter action/entity/date |
| **QR Presensi + GPS Checkin** | `backend/src/routes/attendance.ts` | ✅ **NEW — QR real + Haversine** |
| Register fallback tanpa Supabase | `backend/src/routes/auth.ts` | ✅ **NEW — local bcrypt + JWT** |
| RBAC middleware | `backend/src/middleware/rbac.ts` | ✅ 5 roles |
| Helmett + CSP + CORS | `backend/src/app.ts` | ✅ Security headers |
| Rate limiting | `backend/src/app.ts` | ✅ 200/15m global, 20/15m auth |
| CI/CD pipeline | `.github/workflows/ci.yml`, `e2e.yml` | ✅ 5 jobs |
| Dependabot | `.github/dependabot.yml` | ✅ Weekly npm audits |
| E2E Playwright tests | `e2e/` | ✅ 10 tests in CI |
| Frontend panels (8) | `src/components/` | ✅ All lazy-loaded |

### ⚠️ Known Issues (From SECURITY_AUDIT.md)
| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Seed script no production guard | 🔴 Critical | Unresolved |
| 2 | npm audit — esbuild CVE | 🟠 High | Unresolved |
| 3 | GET `/api/students/:id` missing role check (IDOR) | 🟡 Medium | Unresolved |
| 4 | PUT `/api/materials/:id/download` missing role check | 🟡 Medium | Unresolved |
| 5 | errorHandler.ts 0% coverage | ⚪ Low | Unresolved |
| 6 | Response contains supabaseUid | ⚪ Low | Unresolved |

---

## B. Sprint Backlog (Existing — From `modules/modul4/sprint_backlog.md`)

| Task ID | Fitur | Bobot SP | Prioritas | Dependency |
|---------|-------|----------|-----------|------------|
| TS-101 | **Integrasi Payment Gateway** | 8 SP | 🔴 High | — |
| TS-102 | **Perbaikan UI Dashboard** | 3 SP | 🟡 Medium | — |
| TS-103 | **Optimasi Query Database** | 5 SP | 🔴 High | TS-101 (partial) |

---

## C. Proposed Development Plan — 6 Fase

---

### 🚀 FASE 1: Security Hardening (Fix Known Issues)
**Priority:** 🔴 **CRITICAL**  
**Estimasi:** 1–2 hari  

| Task | Detail | File |
|------|--------|------|
| 1.1 | Guard seed.ts — exit if `NODE_ENV=production` | `backend/prisma/seed.ts:1` |
| 1.2 | Fix npm audit (esbuild CVE) — `npm audit fix --force` | `package.json`, `backend/package.json` |
| 1.3 | Add `requireRole()` ke GET `/api/students/:id` | `backend/src/routes/students.ts:69` |
| 1.4 | Add `requireRole()` ke PUT `/api/materials/:id/download` | `backend/src/routes/materials.ts:57` |
| 1.5 | Remove `supabaseUid` dari `/me` response | `backend/src/routes/auth.ts` |

**Success:** Zero known vulnerabilities, no IDOR, no data leak.

---

### 🚀 FASE 2: Payment Gateway Integration (TS-101)
**Priority:** 🔴 **HIGH** (dari sprint backlog)  
**Estimasi:** 4 hari  
**SP:** 8

| Task | Detail |
|------|--------|
| 2.1 | Pilih provider: Midtrans (recommended) / Xendit / Tripay |
| 2.2 | Buat endpoint `POST /api/finance/payment/create` — generate invoice + snap token |
| 2.3 | Buat webhook handler `POST /api/finance/payment/callback` — update status transaksi |
| 2.4 | Migrasi: tambah field `payment_method`, `payment_channel`, `invoice_url` ke tabel transactions |
| 2.5 | Buat komponen `PaymentButton.tsx` di frontend — popup snap/modal pembayaran |
| 2.6 | Sync status SPP otomatis via webhook |
| 2.7 | Unit test + E2E untuk payment flow |

**Success:** Siswa/wali bisa bayar SPP online via QRIS, Virtual Account, atau Convenience Store.

**Architecture:**
```
[Frontend] → POST /payment/create → [Backend] → Midtrans API → Snap Token
                                                      ↓
[Frontend] ← Snap Token ← [Backend] ←───────────── Midtrans
     ↓ (popup Snap)
[Siswa Bayar] → Midtrans → POST /payment/callback → [Backend] → Update SPP status
```

---

### 🚀 FASE 3: Dashboard UI Enhancement (TS-102)
**Priority:** 🟡 **MEDIUM**  
**Estimasi:** 1.5 hari  
**SP:** 3

| Task | Detail |
|------|--------|
| 3.1 | Loading states untuk semua async operations |
| 3.2 | Empty states (illustration + CTA when no data) |
| 3.3 | Error states (retry button, error message) |
| 3.4 | Mobile responsive — sidebar collapse, table horizontal scroll |
| 3.5 | Dark mode toggle (persist di localStorage) |
| 3.6 | Animasi transisi panel (fadeIn/slideIn) |

**Success:** Setiap panel punya loading/empty/error state. Mobile-friendly.

---

### 🚀 FASE 4: Database & Query Optimization (TS-103)
**Priority:** 🔴 **HIGH**  
**Estimasi:** 2.5 hari  
**SP:** 5

| Task | Detail |
|------|--------|
| 4.1 | Tambah composite indexes (sesuai query pattern) |
| 4.2 | Optimasi `GET /api/finance/summary` — agregasi langsung di SQL |
| 4.3 | Implementasi pagination cursor-based untuk audit logs |
| 4.4 | Query plan analysis via `EXPLAIN ANALYZE` |
| 4.5 | Implementasi query caching (response cache 30s untuk data statis) |

**Success:** Semua endpoint response < 100ms. P95 < 200ms.

---

### 🚀 FASE 5: Full API Migration — Remove Mock Data Dependency
**Priority:** 🟡 **MEDIUM**  
**Estimasi:** 2 hari  

| Task | Detail |
|------|--------|
| 5.1 | Migrasi `SppPanel` dari localStorage ke API (`/api/finance/summary`) |
| 5.2 | Migrasi `RingkasanPanel` dari localStorage ke API |
| 5.3 | Migrasi `ModulPanel` quiz result dari localStorage ke API |
| 5.4 | Hapus `src/data/mockData.ts` (426 lines) setelah semua panel pakai API |
| 5.5 | Update `DataContext.tsx` — hapus persisted state fallback |

**Success:** Zero dependency pada mock data. All data from PostgreSQL via API.

---

### 🚀 FASE 6: Advanced Features
**Priority:** ⚪ **NICE TO HAVE**  
**Estimasi:** 4 hari  

| Task | Detail |
|------|--------|
| 6.1 | **Export PDF** — Laporan siswa, transaksi SPP (puppeteer/pdfkit) |
| 6.2 | **WhatsApp Notification** — Integrasi Twilio/WATI untuk notifikasi SPP & jadwal |
| 6.3 | **Dashboard role-specific** — Guru lihat siswa sendiri, siswa lihat nilai sendiri |
| 6.4 | **Siswa self-checkin QR** — Siswa login via mobile, scan QR sendiri |
| 6.5 | **Visual Regression Tests** — Playwright screenshot comparison |
| 6.6 | **Sentry source maps** — Upload source maps di CI |

---

## D. Current Metrics & Target

| Metric | Current | Target (Post Fase 6) |
|--------|---------|---------------------|
| Frontend tests | 99 | 120+ |
| Backend tests | 298 | 350+ |
| E2E tests | 10 | 20+ |
| Coverage (statements) | 91.35% | 93% |
| Security vulns (high+) | 3 | 0 |
| Mock data dependency | 7 panels | 0 panels |
| API endpoints | 23 | 30+ |
| Response time P95 | Unknown | < 200ms |

---

## E. Implementation Sequence

```
Phase 1: Security  ████████░░░░░░░░░░░░  2 hari
Phase 2: Payment   ████████████████████░░  4 hari
Phase 3: UI        ██████░░░░░░░░░░░░░░  1.5 hari
Phase 4: Database  ██████████░░░░░░░░░░  2.5 hari
Phase 5: API Mig   ████████░░░░░░░░░░░░  2 hari
Phase 6: Advanced  ████████████████░░░░░░  4 hari
                    ─────────────────────────
    Total:                             16 hari
```

**Recommended Start Order:**
1. **Fase 1** (Security dulu before anything)
2. **Fase 2** (Payment Gateway — sprint backlog priority)
3. **Fase 4** (Query optimization — parallel with UI)
4. **Fase 3** (UI Dashboard — parallel with query opt)
5. **Fase 5** (API migration — after UI stabilized)
6. **Fase 6** (Advanced — anytime after core is solid)

---

## F. Risk Register

| Risk | Prob. | Impact | Mitigasi |
|------|-------|--------|----------|
| Payment gateway API changes | Medium | Critical | Sandbox testing, webhook retry |
| Supabase Auth downtime | High | Medium | Fallback local JWT ✅ (done) |
| Database migration downtime | Low | High | `CONCURRENTLY` indexes, off-peak |
| E2E flaky tests | Medium | Low | Retry 2x, screenshot artifact |
| MockData removal breaks panel | Medium | High | Hapus bertahap panel by panel |

---

## G. Approval

**Pilih opsi untuk memulai:**

| Opsi | Fase | Durasi |
|------|------|--------|
| **A** | Fase 1 (Security Fix) | ~2 jam |
| **B** | Fase 2 (Payment Gateway) | 4 hari |
| **C** | Fase 1+2 (Security → Payment) | ~4 hari |
| **D** | Full implementation (all 6 fase) | ~16 hari |

Balas dengan: `"Mulai [A/B/C/D]"` atau nomor task spesifik.
