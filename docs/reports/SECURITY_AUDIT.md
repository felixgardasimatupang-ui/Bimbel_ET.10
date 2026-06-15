# 🔒 Comprehensive Security & Code Audit Report
**Project:** EduAdmin Bimbel  
**Date:** 2026-06-15  
**Scope:** Full-stack (frontend + backend)  
**Methodology:** SAST, dependency audit, manual code review + OWASP Top 10

---

## Executive Summary

**Overall Risk Rating: MEDIUM** — 6 High, 5 Medium, 4 Low findings

| Severity | Count | Action |
|----------|-------|--------|
| 🔴 Critical | 1 | Fix immediately |
| 🟠 High | 3 | Fix before production |
| 🟡 Medium | 5 | Fix within 1 sprint |
| ⚪ Low | 4 | Nice to have |

**Strengths:**
- ✅ Parameterized queries via Prisma (no SQL injection)
- ✅ React auto-escaped output (no XSS)
- ✅ Logger redacts sensitive fields (passwords, tokens)
- ✅ CSP headers configured with strict `default-src: 'none'`
- ✅ Rate limiting on auth endpoints (20/15min)
- ✅ Helmet security headers (HSTS, XSS protection, etc.)
- ✅ Pino structured logging (not console.log)
- ✅ Constant-time password comparison (`timingSafeEqual`)
- ✅ 194 backend tests with 91.35% coverage

---

## 🔴 Critical Findings

### CRIT-001: Seed script has no production guard
**File:** `backend/prisma/seed.ts`  
**Risk:** Jika `npm run db:seed` dijalankan di production, akan menghapus dan menimpa semua data user dengan demo credentials.  
**Impact:** Data loss + security breach (demo passwords gampang ditebak)  
**Remediation:** Tambahkan guard di awal seed.ts:
```typescript
if (process.env.NODE_ENV === 'production') {
  console.error('Tidak bisa menjalankan seed di production!');
  process.exit(1);
}
```
**Status:** ❌ Unresolved

---

## 🟠 High Findings

### HIGH-001: Demo credentials bisa dipakai di production
**File:** `backend/prisma/seed.ts:70-82`  
**Risk:** `admin@bimbel.edu` / `admin123` bisa digunakan untuk login jika seed pernah dijalankan di production  
**Impact:** Unauthorized access ke admin panel  
**Remediation:** Guard production + ganti password seed untuk production

### HIGH-002: JWT dev fallback secrets
**File:** `backend/src/server.ts:19-20`  
**Risk:** Jika env vars `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` tidak di-set, fallback ke `'dev-fallback-change-me'`. Meski sudah ada guard `validateEnv()` untuk production, kode tetap beresiko jika ada misconfiguration.  
**Impact:** Siapa pun yang tahu secret bisa memalsukan JWT  
**Remediation:** Hapus fallback, throw error alih-alih pakai default
```typescript
// Ganti baris 19-20 dengan:
throw new Error('JWT_ACCESS_SECRET is not set');
```

### HIGH-003: esbuild vulnerabilities (npm audit)
**File:** `package.json` + `backend/package.json`  
**Risk:** CVE memungkinkan RCE via `NPM_CONFIG_REGISTRY`  
**Impact:** Remote code execution  
**Remediation:** 
```bash
# Frontend — breaking change
npm audit fix --force
# Backend
cd backend && npm audit fix
```
**Status:** ❌ 3 high severity total (2 frontend, 1 backend)

---

## 🟡 Medium Findings

### MED-001: Access token disimpan di memory (not HttpOnly cookie)
**File:** `src/api/client.ts:14-26`  
**Risk:** Access token disimpan di module-level variable, bukan HttpOnly cookie. Rentan XSS token theft (meski React auto-escape, masih ada risk dari third-party scripts).  
**Impact:** Jika terjadi XSS, token bisa dicuri  
**Remediation:** Pindahkan access token ke HttpOnly cookie, bukan memory. Refresh token sudah di cookie → access token juga sebaiknya di cookie.

### MED-002: GET /api/students/:id — potensi IDOR
**File:** `backend/src/routes/students.ts:69-83`  
**Risk:** Endpoint `GET /api/students/:id` tidak punya `requireRole`. Siswa bisa melihat data siswa lain jika tahu ID-nya.  
**Impact:** Information disclosure (data pribadi siswa lain)  
**Remediation:** 
```typescript
router.get('/:id', requireRole('SUPER_ADMIN', 'ADMIN', 'GURU'), async (req, res) => { ... })
```

### MED-003: PUT /api/materials/:id/download — missing role check
**File:** `backend/src/routes/materials.ts:57`  
**Risk:** Endpoint increment download count tanpa role check. Siapa pun yang authenticated bisa increment download count sembarang material.  
**Impact:** Manipulasi data (download count tidak akurat)  
**Remediation:** Tambahkan `requireRole('SUPER_ADMIN', 'ADMIN', 'GURU', 'SISWA')`

### MED-004: Password field dead code
**File:** `backend/src/utils/crypto.ts` + `backend/prisma/schema.prisma`  
**Risk:** Password di-hash via `crypto.ts` dan disimpan di DB, tapi authentication flow menggunakan Supabase Auth (bukan verifikasi lokal). Field `password` di tabel users tidak pernah dipakai untuk autentikasi.  
**Impact:** Code confusion, potential security theater  
**Remediation:** Hapus field `password` dari schema jika memang tidak dipakai, atau integrasikan dengan login flow.

### MED-005: Multiple endpoints return without role filtering
**File:** Multiple routes (students GET, materials GET, notifications GET)  
**Risk:** Semua authenticated user bisa mengakses semua data tanpa batasan role untuk operasi read  
**Impact:** Data leakage (misal: siswa bisa lihat semua data keuangan di masa depan)  
**Remediation:** Evaluate setiap endpoint apakah perlu `requireRole()` tambahan

---

## ⚪ Low Findings

### LOW-001: Untested middleware (0% coverage)
**Files:** `backend/src/middleware/errorHandler.ts`, `backend/src/middleware/sentry.ts`  
**Risk:** Tidak ada test untuk error handling dan sentry initialization  
**Remediation:** Tambahkan test sederhana untuk error handler:
```typescript
it('returns 500 with generic message in production', () => { ... })
```

### LOW-002: Response contains supabaseUid
**File:** `backend/src/routes/auth.ts:336`  
**Risk:** Endpoint `/me` mengembalikan `supabaseUid` yang merupakan internal identifier Supabase  
**Impact:** Information disclosure minor (internal ID exposed)  
**Remediation:** Hapus `supabaseUid` dari select query di `/me`

### LOW-003: Multiple res.status().json() without early return
**File:** Multiple routes (students.ts:72, auth.ts:80, etc.)  
**Risk:** Meski ada `return` setelah `res.json()`, pattern tidak konsisten. Ada kasus di mana response dikirim dua kali jika `return` terlewat.  
**Remediation:** Standarisasi pattern: `return res.status(..).json(..)` atau `res.status(..).json(..); return;`

### LOW-004: No CSP nonce/hash untuk assets
**File:** `backend/src/app.ts:24-41`  
**Risk:** CSP `default-src: 'none'` sudah strict, tapi tidak ada `nonce` untuk inline scripts/styles.  
**Remediation:** API-only app, jadi risk rendah. Tapi tetap tambahkan `nonce` jika ada inline scripts di masa depan.

---

## 📊 Coverage Gaps

| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| `errorHandler.ts` | 0% | 0% | 0% | 0% |
| `sentry.ts` (middleware) | 0% | 100% | 0% | 0% |
| `app.ts` | 88.88% | 57.14% | 80% | 90.9% |
| `students.ts` | 88% | 83.33% | 100% | 89.18% |
| `auth.ts` (routes) | 90.62% | 78.68% | 100% | 90.62% |

---

## 🔧 Actions Required (Priority Order)

### Fix Now (Before Production):
```bash
# 1. Guard seed.ts
cd backend && grep -n "NODE_ENV" prisma/seed.ts
# Tambahkan: if (process.env.NODE_ENV === 'production') process.exit(1)

# 2. Fix npm audit
cd backend && npm audit fix
# If needed: cd .. && npm audit fix --force

# 3. Remove JWT fallback secrets
# Edit src/server.ts lines 19-20
```

### Fix This Sprint:
```
1. Add requireRole() to GET /api/students/:id
2. Add requireRole() to PUT /api/materials/:id/download
3. Add tests for errorHandler.ts and sentry.ts middleware
4. Add production guard to seed.ts
```

### Monitor:
```
1. Dependabot PRs (weekly)
2. npm audit output in CI
3. Coverage trends in Codecov
```

---

## ✅ Verified Secure (No Action Needed)

| Area | Status | Evidence |
|------|--------|----------|
| SQL Injection | ✅ Safe | Prisma ORM + parameterized $executeRaw |
| XSS | ✅ Safe | React auto-escape, no dangerouslySetInnerHTML |
| Helmet CSP | ✅ Strict | `default-src: 'none'`, HSTS preload |
| CORS | ✅ Safe | Whitelist-based, warning on wildcard |
| Rate Limiting | ✅ Active | 200/15min global, 20/15min auth |
| Logger Redaction | ✅ Active | Passwords, tokens, cookies redacted |
| Password Hashing | ✅ Strong | scrypt + 128-bit salt + timingSafeEqual |
| Refresh Token | ✅ Secure | HttpOnly cookie, rotation on use |
| Error Display | ✅ Safe | Generic msg in production |
| Sentry Init | ✅ Safe | Optional, skips if DSN missing |

---

## Appendix: SAST Tool Output

### npm audit — Frontend
```
2 high severity
- esbuild: RCE via NPM_CONFIG_REGISTRY (CVE-2025)
- Affects: vite → esbuild
- Fix: npm audit fix --force (breaking change to vite@8)
```

### npm audit — Backend
```
1 high severity
- esbuild: RCE via NPM_CONFIG_REGISTRY (CVE-2025)
- Affects: tsx → esbuild
- Fix: npm audit fix
```

### Hardcoded Secrets Scan
```
No hardcoded production secrets found.
Demo credentials in seed.ts (acceptable for dev).
Logger has proper redaction config.
```

---

**Report Generated:** 2026-06-15  
**Auditor:** AI Security Reviewer  
**Next Scheduled Audit:** Recommend after next 10 commits
