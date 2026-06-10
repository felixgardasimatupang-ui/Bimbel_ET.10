# AGENTS.md — EduAdmin Bimbel

## Project

React 19 SPA for tutoring management (students, teachers, SPP/finance, modules, access control). Mock-data only, no real backend.

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Vite dev server on `http://0.0.0.0:3000` |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | TypeScript type-check (`tsc --noEmit`, strict mode) |
| `npm run lint:eslint` | ESLint check on `src/` |
| `npm run test` | Vitest unit tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run preview` | Vite preview of built output |
| `npm run clean` | Remove `dist/` |

Test infrastructure: Vitest + @testing-library/react (33+ test cases in `src/test/`). ESLint configured via `eslint.config.js`.

## Setup

1. `npm install`
2. `npm run dev`

## Architecture

- **Entry:** `src/main.tsx` → renders `<App />`
- **State-driven routing:** No react-router; `activeTab` state switches between 6 panels: `ringkasan`, `siswa`, `pengajar`, `spp`, `modul`, `hak_akses`
- **Code splitting:** All 6 panels lazy-loaded via `React.lazy()` + `<Suspense>` — main chunk ~247KB, largest panel ~395KB (RingkasanPanel/recharts)
- **Persistence:** `usePersistedState` hook — reads/writes localStorage under `edu_*` keys
- **Components:** `src/components/` (11 files)
- **Utils:** `src/utils/validation.ts` — pure functions for validation, filtering, CSV safety
- **Mock data:** `src/data/mockData.ts`
- **Types:** `src/types.ts` — `Siswa`, `Teacher`, `Transaksi`, `MateriBelajar`, `Notifikasi`, `UserRole`, etc.
- **Tests:** `src/test/` — Vitest (33+ tests covering usePersistedState, Toast, StatsStrip, ErrorBoundary, SppPanel, validation)

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
- User name from `APP_USER_NAME` constant in `App.tsx` (not hardcoded in sidebar)
- All RBAC is client-side only (role selector in sidebar)
- All data stored in localStorage without encryption
- Rate limiting enabled on all mutation handlers (500ms cooldown, 300ms for checkin)
- No loading/empty/error states for async operations (except GPS)
- `metadata.json` no longer claims Gemini API capability
