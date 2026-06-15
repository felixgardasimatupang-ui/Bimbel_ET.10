# Implementation Plan — Testing & CI Enhancement
**Project:** EduAdmin Bimbel  
**Date:** 2026-06-15  
**Status:** DRAFT - Awaiting Approval

---

## Executive Summary

Berdasarkan analisis repository, proyek ini memiliki:
- ✅ Frontend testing (85 unit tests dengan Vitest)
- ✅ CI untuk frontend (lint, test, build)
- ⚠️ Backend TIDAK memiliki unit/integration tests
- ⚠️ E2E tests (Playwright) belum terintegrasi di CI
- ⚠️ Coverage reporting tidak ada

**Tujuan:** Meningkatkan code quality, test coverage, dan CI/CD reliability dalam 4 fase.

---

## Fase Implementasi

### 🎯 Fase 1: Backend Unit & Integration Tests (Prioritas TINGGI)
**Durasi:** 3-5 hari  
**Impact:** Critical — backend saat ini zero test coverage

#### Target Coverage:
- Auth middleware: `backend/src/middleware/auth.ts`
- RBAC middleware: `backend/src/middleware/rbac.ts`
- Auth routes: `backend/src/routes/auth.ts` (login, register, refresh)
- Students routes: `backend/src/routes/students.ts` (CRUD)
- Finance routes: `backend/src/routes/finance.ts` (CRUD)

#### Deliverables:
1. **Setup testing infrastructure**
   - Install: `vitest`, `supertest`, `@types/supertest`
   - Create: `backend/vitest.config.ts`
   - Create: `backend/src/test/setup.ts` (mock Prisma, Supabase)

2. **Write test files** (minimal 70% coverage target)
   ```
   backend/src/test/
   ├── middleware/
   │   ├── auth.test.ts
   │   └── rbac.test.ts
   ├── routes/
   │   ├── auth.test.ts
   │   ├── students.test.ts
   │   └── finance.test.ts
   └── utils/
       └── prisma-mock.ts
   ```

3. **Update backend package.json scripts**
   ```json
   {
     "test": "vitest run",
     "test:watch": "vitest",
     "test:coverage": "vitest run --coverage"
   }
   ```

4. **CI Integration**
   - Update `.github/workflows/ci.yml` → add backend test job
   - Add coverage threshold (70% minimum)
   - Fail CI if coverage drops

#### Success Criteria:
- [ ] Backend test suite runs: `cd backend && npm test`
- [ ] Coverage ≥ 70% for auth/RBAC/routes
- [ ] CI job "Backend Tests" passing
- [ ] Test execution time < 30s

---

### 🎯 Fase 2: E2E Tests with Playwright in CI (Prioritas SEDANG)
**Durasi:** 2-3 hari  
**Impact:** High — E2E coverage untuk user flows kritis

#### Scope:
1. **Login flow** (`e2e/login.spec.ts` sudah ada?)
2. **Student CRUD** (create, read, update, delete student)
3. **Finance transaction** (create payment)
4. **Material management** (upload, view)

#### Deliverables:
1. **Docker Compose ephemeral setup**
   - Create: `.github/workflows/e2e.yml`
   - Steps:
     1. Start postgres + backend + frontend via `docker-compose`
     2. Wait for healthchecks (curl retry loop)
     3. Run `npx playwright test`
     4. Upload screenshots/videos as artifacts
     5. Teardown containers

2. **Playwright test files**
   ```
   e2e/
   ├── auth/
   │   └── login.spec.ts
   ├── students/
   │   └── crud.spec.ts
   ├── finance/
   │   └── transaction.spec.ts
   └── materials/
       └── upload.spec.ts
   ```

3. **CI badge**
   - Add E2E status badge to README.md

#### Success Criteria:
- [ ] E2E tests run in CI via docker-compose
- [ ] All critical flows covered (4 specs minimum)
- [ ] Screenshots/videos artifact available on failure
- [ ] E2E job completes in < 5 minutes

---

### 🎯 Fase 3: Coverage Reporting & Badges (Prioritas RENDAH)
**Durasi:** 1 hari  
**Impact:** Medium — visibility & accountability

#### Deliverables:
1. **Setup Codecov/Coveralls**
   - Create account & get upload token
   - Add to GitHub Secrets: `CODECOV_TOKEN`
   - Update CI to upload coverage:
     ```yaml
     - name: Upload coverage
       uses: codecov/codecov-action@v3
       with:
         files: ./coverage/coverage-final.json
     ```

2. **Add badges to README**
   ```markdown
   ![Build Status](https://github.com/.../workflows/CI/badge.svg)
   ![Coverage](https://codecov.io/.../graph/badge.svg)
   ![Tests](https://img.shields.io/badge/tests-85%20passing-brightgreen)
   ```

3. **Coverage HTML reports**
   - Store as CI artifacts
   - Accessible via Actions tab → Artifacts download

#### Success Criteria:
- [ ] Coverage badge visible in README
- [ ] Coverage trend tracked over time
- [ ] HTML report downloadable from CI

---

### 🎯 Fase 4: Security Hardening & Dependency Audits (Prioritas SEDANG)
**Durasi:** 2 hari  
**Impact:** High — production readiness

#### Deliverables:
1. **Dependabot setup**
   - Create: `.github/dependabot.yml`
   ```yaml
   version: 2
   updates:
     - package-ecosystem: npm
       directory: "/"
       schedule:
         interval: weekly
     - package-ecosystem: npm
       directory: "/backend"
       schedule:
         interval: weekly
   ```

2. **Secrets scanning**
   - Enable GitHub Secret Scanning (free for public repos)
   - Add `.gitleaks.toml` for local pre-commit hook

3. **npm audit CI job**
   ```yaml
   - name: Security Audit
     run: |
       npm audit --audit-level=moderate
       cd backend && npm audit --audit-level=moderate
   ```

4. **CSP & CORS review**
   - Verify `backend/src/middleware/security.ts`:
     - CORS whitelist (no `*` in production)
     - CSP directives (no `unsafe-inline` unless necessary)
   - Add test: `backend/src/test/middleware/security.test.ts`

5. **Remove demo credentials dari production**
   - Ensure `backend/prisma/seed.ts` only runs in dev
   - Add warning comment in seed file
   - Update README: "Demo credentials for development only"

#### Success Criteria:
- [ ] Dependabot PRs appear weekly
- [ ] `npm audit` passes in CI (no high/critical)
- [ ] Secrets scan: zero leaks detected
- [ ] CSP headers verified with securityheaders.com
- [ ] Seed script has `if (NODE_ENV !== 'production')` guard

---

## Resource Requirements

### Tools & Services (Free Tier)
- Codecov/Coveralls: Free for open source
- Dependabot: Built-in GitHub feature
- GitHub Actions: 2000 minutes/month (free tier)

### Developer Time Estimate
- Fase 1: 16-24 hours (backend tests)
- Fase 2: 8-12 hours (E2E CI)
- Fase 3: 4 hours (coverage reporting)
- Fase 4: 8 hours (security)

**Total:** 36-48 hours (~ 1 sprint)

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Backend tests break existing code | Medium | High | Write tests incrementally, run regression |
| E2E flaky tests in CI | High | Medium | Add retry logic, increase timeouts |
| Coverage upload fails | Low | Low | Fallback to HTML artifact only |
| Dependabot spam PRs | Medium | Low | Set weekly schedule, auto-merge patch |
| CI quota exceeded | Low | Medium | Optimize job parallelization |

---

## Success Metrics

### Before Implementation:
- Frontend: 85 tests ✅
- Backend: 0 tests ❌
- E2E: Not in CI ❌
- Coverage: Unknown ❌
- Security: Manual only ❌

### After Implementation (Target):
- Frontend: 85 tests ✅
- Backend: 50+ tests, 70% coverage ✅
- E2E: 4+ specs in CI ✅
- Coverage: Tracked & badged ✅
- Security: Automated audits ✅

---

## Next Steps (Choose One or More)

**Option A: Start with Fase 1 (Backend Tests)**
```bash
# Agent will:
1. Create backend/vitest.config.ts
2. Setup Prisma mock utilities
3. Write auth.test.ts + rbac.test.ts
4. Write auth routes test (login, register, refresh)
5. Update CI workflow
```

**Option B: Start with Fase 2 (E2E CI)**
```bash
# Agent will:
1. Create .github/workflows/e2e.yml
2. Write docker-compose.e2e.yml (ephemeral)
3. Write Playwright specs for critical flows
4. Add healthcheck scripts
```

**Option C: Start with Fase 4 (Security First)**
```bash
# Agent will:
1. Setup Dependabot
2. Add npm audit to CI
3. Review & test CSP/CORS config
4. Add seed.ts production guard
```

**Option D: Full Implementation (All Phases)**
```bash
# Agent will execute Fase 1 → 2 → 3 → 4 sequentially
# Estimated time: 2-3 sessions (with verification between phases)
```

---

## Approval Required

**Question for User:**  
Pilih salah satu opsi di atas:
- **A** — Backend Tests (paling kritis)
- **B** — E2E CI Integration
- **C** — Security Hardening (tercepat)
- **D** — Full Implementation (semua fase)

**Command to approve:**  
Reply dengan: `"Mulai Fase [A/B/C/D]"` atau `"Execute Option [A/B/C/D]"`

---

## Dependencies & Constraints

### Must Have Before Starting:
- ✅ Repository cloned locally
- ✅ `npm install` (root + backend) completed
- ✅ `.env` files configured (DATABASE_URL, SUPABASE_*)
- ✅ Database accessible (local postgres or Supabase)

### Will Be Verified:
- Current test status: `npm test` (frontend)
- Backend typecheck: `cd backend && npx tsc --noEmit`
- Docker available: `docker --version`
- Playwright installed: `npx playwright --version`

---

## Rollback Plan

If any fase fails:
1. **Fase 1:** Revert `backend/src/test/` folder, restore package.json
2. **Fase 2:** Remove `.github/workflows/e2e.yml`, keep test files
3. **Fase 3:** Remove coverage upload step, keep local reports
4. **Fase 4:** Revert dependabot.yml, keep audit script

All changes will be in separate commits for easy revert.

---

**END OF PLAN — Awaiting User Decision**
