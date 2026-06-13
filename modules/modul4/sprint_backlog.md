# Sprint Backlog — EduAdmin Bimbel

**Sprint:** Modul 4
**Total Story Points:** 16 SP
**Estimasi:** 8 Hari (0.5 hari/SP, buffer: 2 hari -> **10 hari**)

---

## Task List

| Task ID | Fitur/Modul | Bobot SP | Estimasi (Hari) | Prioritas | Dependency | Status |
|---------|-------------|----------|-----------------|-----------|------------|--------|
| TS-101 | Integrasi Payment Gateway | **8** | **4** | **High** | — | Pending |
| TS-102 | Perbaikan UI Dashboard | **3** | **1.5** | Medium | — | Pending |
| TS-103 | Optimasi Query Database | **5** | **2.5** | **High** | TS-101 (partial) | Pending |

---

## Burndown Chart (Simulasi)

```
SP Left
16 | ████  (Day 0)
12 | ███   (Day 2: TS-101 progress -4 SP)
 8 | ██    (Day 4: TS-101 done, TS-103 progress)
 5 | █     (Day 6: TS-103 done, TS-102 progress)
 0 |       (Day 8: All done)
   +--------------------------------
    0   2   4   6   8   Hari
```

---

## Risk Register

| Risiko | Probabilitas | Dampak | Mitigasi |
|--------|-------------|--------|----------|
| TS-101: Payment gateway API downtime/ext changes | Medium | Critical | Siapkan mock/sandbox, fallback manual |
| TS-101: Dependency eksternal (pihak ketiga) slow | High | High | Parallel task TS-103 selama nunggu |
| TS-103: Index migration perlu downtime | Low | High | Gunakan CONCURRENTLY, jadwal off-peak |
| TS-102: Design feedback loop panjang | Medium | Low | Gunakan mockup dulu sebelum implement |
| **Overkapasitas: 16 SP > tim capacity** | **High** | **Medium** | **Negosiasi dengan PO: kurangi scope TS-102 jadi cosmetic-only** |

---

## Critical Path

```
TS-101 (8 SP, 4 hari) ──────────────────> Done
                                              │
TS-103 (5 SP, 2.5 hari) ──> mulai setelah ───┤ TS-101 API contract clear
                                              │
TS-102 (3 SP, 1.5 hari) ──> parallel ────────┤ (tidak blocking)
```

**Catatan:** TS-101 dan TS-103 adalah *critical path*. Keterlambatan TS-101 akan menggeser seluruh jadwal.
