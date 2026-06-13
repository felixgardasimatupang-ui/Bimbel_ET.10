# Modul 2: Migrasi Database — Read-Heavy Replication

## Arsitektur

```
[App Server] --write--> [Primary]
     |                      |
     |        [Replica-1] <-+-- streaming WAL
     |        [Replica-2] <-+-- streaming WAL
     |
     +--read (report)--> [Replica-1 / Replica-2]
     +--read (financial)--> [Primary]  (zero tolerance)
```

## Root Cause Replication Lag

Berdasarkan analisis ask-impact-sentinel:

| Faktor | Dampak |
|--------|--------|
| Tidak ada health-check otomatis | Lag tidak terdeteksi hingga laporan finansial inkonsisten |
| Laporan finansial ke replica | Padahal harus ke primary (zero tolerance) |
| Tidak ada rollback plan | Tim tidak bisa revert cepat saat lag melonjak |
| Tidak ada alerting | Monitoring pasif, baru reaktif setelah 3 jam |

## Action Items

1. **Segera:** Failback laporan finansial ke primary
2. **1 jam:** Pasang alert replication_lag > 30 detik
3. **2 jam:** Rollback ke monolitik jika lag tidak stabil
4. **Post-mortem:** Root cause analysis kenapa lag melonjak
