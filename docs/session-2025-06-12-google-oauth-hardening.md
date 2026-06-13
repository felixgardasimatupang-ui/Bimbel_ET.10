# Session: Google OAuth + Security Hardening + Deployment Prep

**Date:** 2025-06-12

## Goal
Implement and harden Google OAuth login for EduAdmin Bimbel with comprehensive testing and security audit.

## Tech Stack
- Frontend: React 19 + Vite + Tailwind CSS v4 + TypeScript
- Backend: Express 5 + TypeScript + Prisma 6 + PostgreSQL
- Auth: Supabase Auth (email/password) + custom JWT (Google OAuth)

## Key Decisions
- **Dual auth strategy**: Existing Supabase JWTs for email/password users; custom `jsonwebtoken` JWTs for Google OAuth users — avoids creating Supabase accounts for Google users
- **Token verification**: `OAuth2Client.verifyIdToken()` from `google-auth-library` (server-side)
- **Refresh token rotation**: Custom random hex tokens stored in `refresh_tokens` table for Google users
- **Config module**: Extract `VITE_GOOGLE_CLIENT_ID` to `src/config.ts` -> `getGoogleClientId()` — makes it mockable in vitest
- **Landing page design**: Tailwind CSS v4 + lucide-react icons — no additional UI library
- **All skills in `skills/` must be loaded and followed** when applicable (AGENTS.md requirement)

## What Was Done

### Prisma Schema (Migration 0002)
- `password` column made nullable (`String?`)
- Added `provider` (`String?`) — set to `"google"` for Google users
- Added `providerId` (`String?`) — Google's `sub` claim
- Migration: `backend/prisma/migrations/0002_add_google_oauth/migration.sql`

### Backend API
- `POST /api/auth/google` — verify ID token via `OAuth2Client.verifyIdToken`, upsert user, sign custom JWT, create refresh token
- `POST /api/auth/refresh` — try Supabase refresh first, fall back to custom refresh token verification
- `POST /api/auth/logout` — clean up custom refresh tokens, clear cookie
- `GET /api/auth/me` — includes `provider` field
- Auth middleware: try Supabase JWT first, then custom JWT for Google users
- Rate limiting on `/api/auth/google`, `/api/auth/refresh`, `/api/auth/logout`
- `validateEnv()` in `server.ts` — crashes in production if JWT secrets missing, logs warning + injects fallback in dev
- New env vars: `GOOGLE_CLIENT_ID`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `GOOGLE_DEFAULT_ROLE`

### Frontend LoginPage
- Full landing page redesign: animated gradient background, brand identity, feature cards, glassmorphism login card, Google Sign-In button
- Google Sign-In button hidden entirely when `VITE_GOOGLE_CLIENT_ID` is empty
- Import client ID from `src/config.ts` (not `import.meta.env` directly)
- `src/contexts/AuthContext.tsx` — added `googleLogin(idToken)` method
- `src/api/client.ts` — added `googleLoginApi(idToken)` function

### Security Hardening
- Ran OWASP audit via `ask-owasp-security-review` + `security-and-hardening` + `ask-security-sentinel`
- Fixes applied:
  - **A02**: Removed hardcoded JWT fallback — `validateEnv()` crashes in production if missing
  - **A01**: Google user role from `GOOGLE_DEFAULT_ROLE` env var (validated against `UserRole` enum)
  - **A08**: `crossorigin="anonymous"` on GIS script tag
  - **A04**: Extended auth rate limiter to refresh and logout endpoints
  - **A05**: `'unsafe-inline'` in CSP documented as accepted risk (Tailwind v4 requirement)
- Created `SECURITY_AUDIT.md`

### Quality Gates
- Frontend type-check: ✅ Clean (fixed pre-existing `supabase` null error in AuditLogPanel.tsx)
- Frontend ESLint: ✅ 0 errors (1 `any` warning in test file)
- Frontend tests: 98 passed
- Backend type-check: ✅ Clean
- Backend tests: 46 passed
- `npm audit`: 0 vulnerabilities

### Deployment (Docker Compose)
- `docker-compose.yml`: Added `GOOGLE_CLIENT_ID`, `GOOGLE_DEFAULT_ROLE` to API service; `VITE_GOOGLE_CLIENT_ID` to frontend service
- `nginx.conf`: Fixed `proxy_pass` from old Railway URL → `http://api:3001`; updated CSP for Google OAuth domains

## Key Constraints
| Rule | Detail |
|------|--------|
| JWT secrets | Never hardcode — validated at startup via `validateEnv()` |
| Google role | Use `GOOGLE_DEFAULT_ROLE` env var, not hardcoded `'ADMIN'` |
| Env access | Use config module, not `import.meta.env` directly in components |
| Google Sign-In visibility | Hidden when `VITE_GOOGLE_CLIENT_ID` is empty — production-safe |
| CSP | nginx.conf must include Google OAuth domains for production |

## Remaining Steps (Manual)
1. Create Google OAuth credentials at https://console.cloud.google.com/apis/credentials
   - OAuth client ID → Web application
   - Authorized JS origins: dev (`http://localhost:3000`) + production URL
2. Deploy via Docker Compose: `export GOOGLE_CLIENT_ID="..." && docker compose up --build`

## Relevant Files
| File | Purpose |
|------|---------|
| `backend/prisma/schema.prisma` | User model — password nullable, provider, providerId |
| `backend/prisma/migrations/0002_add_google_oauth/migration.sql` | Schema migration |
| `backend/src/routes/auth.ts` | POST /api/auth/google |
| `backend/src/middleware/auth.ts` | Dual JWT verification |
| `backend/src/server.ts` | validateEnv() startup check |
| `backend/.env.example` | All env vars documented |
| `backend/src/test/auth-google.test.ts` | 14 backend tests |
| `src/config.ts` | getGoogleClientId() |
| `src/components/LoginPage.tsx` | Landing page redesign |
| `src/contexts/AuthContext.tsx` | googleLogin method |
| `src/api/client.ts` | googleLoginApi function |
| `src/test/LoginPage.test.tsx` | 21 frontend tests |
| `src/test/AuthContext.test.tsx` | 3 auth context tests |
| `index.html` | GIS script + CSP |
| `docker-compose.yml` | Updated with Google OAuth vars |
| `nginx.conf` | Fixed proxy_pass + CSP |
| `SECURITY_AUDIT.md` | OWASP audit report |
