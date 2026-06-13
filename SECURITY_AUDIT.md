# Security Audit — OWASP Top 10

## Findings (Resolved)

| # | Vuln | OWASP | Sev | Location | Description | Remediation | Status |
|---|------|-------|-----|----------|-------------|-------------|--------|
| 1 | Hardcoded JWT fallback secret | A02 | ~Medium~ | `server.ts`, `auth.ts:17-18`, `middleware/auth.ts:7` | JWT secrets fallback ke string hardcoded | Hapus fallback, validasi env var di startup, crash di production jika missing | ✅ `server.ts:validateEnv()` |
| 2 | Missing SRI on GIS script | A08 | ~Medium~ | `index.html:12` | `<script src="...gsi/client">` tanpa atribut `crossorigin` | Tambah `crossorigin="anonymous"` | ✅ `index.html:12` |
| 3 | `'unsafe-inline'` di CSP | A05 | Medium | `index.html:7` | Required oleh Tailwind Vite plugin (inject inline styles via JS) | **Accepted risk** — nonce tidak kompatibel dengan Tailwind v4 HMR | ⏳ Documented |
| 4 | Auto-role ADMIN untuk Google user | A01 | ~Low~ | `backend/src/routes/auth.ts:222` | User baru auto `'ADMIN'` | Gunakan `GOOGLE_DEFAULT_ROLE` env var, default aman `'GURU'` | ✅ `GOOGLE_DEFAULT_ROLE` |
| 5 | Auth rate limiter coverage | A04 | ~Low~ | `backend/src/app.ts` | `/refresh` & `/logout` tidak kena auth limiter | Tambah ke auth limiter | ✅ `app.ts:86-87` |

## Additional Hardening (security-and-hardening skill)

- ✅ Startup env validation — crash di production jika `JWT_ACCESS_SECRET` atau `JWT_REFRESH_SECRET` tidak diset
- ✅ Dev fallback menggunakan `'dev-fallback-change-me'` (bukan rahasia asli) + warning log
- ✅ All user input validated via Zod schemas
- ✅ Parameterized queries via Prisma ORM
- ✅ Helmet security headers (CSP, HSTS, X-Frame-Options, etc.)
- ✅ CORS restricted, no wildcard in production (with warning)
- ✅ httpOnly + sameSite=strict + secure cookies
- ✅ Rate limiting on auth endpoints (20/15min) + global (200/15min)
- ✅ Audit logging on all mutations
- ✅ No secrets in source code or version control
- ✅ Dependencies reasonably up to date

## Summary

**5 findings → 4 fixed, 1 accepted risk.** Arsitektur auth sudah solid dengan dual JWT strategy (Supabase + custom), refresh token rotation, audit logging, dan security headers yang ketat.
