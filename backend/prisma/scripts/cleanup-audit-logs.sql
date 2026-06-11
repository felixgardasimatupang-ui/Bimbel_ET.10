-- Audit Log Retention Policy
-- Hapus audit logs lebih dari 90 hari (kecuali SEED)
-- Jalankan via cron setiap hari: 0 3 * * *
-- Migration-friendly: cast enum ke text untuk kompatibilitas

DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '90 days'
  AND action::text != 'SEED';

-- Opsional: archive dulu sebelum delete
-- CREATE TABLE audit_logs_archive (LIKE audit_logs INCLUDING ALL);
-- INSERT INTO audit_logs_archive SELECT * FROM audit_logs
--   WHERE created_at < NOW() - INTERVAL '90 days' AND action::text != 'SEED';
-- TRUNCATE audit_logs;
-- INSERT INTO audit_logs SELECT * FROM audit_logs_archive
--   WHERE action::text = 'SEED' OR created_at >= NOW() - INTERVAL '90 days';
-- DROP TABLE audit_logs_archive;
