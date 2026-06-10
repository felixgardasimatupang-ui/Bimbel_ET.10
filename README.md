# EduAdmin Bimbel — Manajemen Les Terpadu

React 19 SPA untuk manajemen bimbingan belajar (siswa, pengajar, SPP/keuangan, modul, kontrol akses). Mock-data only, no real backend.

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Vite dev server on `http://0.0.0.0:3000` |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | TypeScript type-check (`tsc --noEmit`, strict mode) |
| `npm run preview` | Vite preview of built output |
| `npm run test` | Run Vitest unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run clean` | Remove `dist/` |

## Setup

1. `npm install`
2. `npm run dev`

## Architecture

- **Entry:** `src/main.tsx` → renders `<App />`
- **State-driven routing:** No react-router; `activeTab` state switches between 6 panels: `ringkasan`, `siswa`, `pengajar`, `spp`, `modul`, `hak_akses`
- **Code splitting:** Each panel is lazy-loaded via `React.lazy()` + `<Suspense>`
- **Persistence:** `usePersistedState` hook — reads/writes localStorage under `edu_*` keys
- **Components:** `src/components/` (11 files)
- **Mock data:** `src/data/mockData.ts`
- **Types:** `src/types.ts`
- **Tests:** `src/test/` — Vitest + Testing Library (13 test cases)
- **Chunk breakdown:** Main app ~244KB, RingkasanPanel ~395KB (recharts), others 4-14KB each

## Tech Stack

- React 19 + TypeScript 5.8 (strict mode)
- Vite 6 + Tailwind CSS v4
- Recharts (charting)
- Lucide React (icons)
- Vitest + Testing Library (tests)

## Notes

- All RBAC is client-side only (role selector in sidebar)
- All data stored in localStorage without encryption
- No loading/error states for async operations (except GPS)
