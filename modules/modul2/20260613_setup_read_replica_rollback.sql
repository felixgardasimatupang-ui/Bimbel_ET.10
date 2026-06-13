-- Rollback: Kembali ke arsitektur monolitik
-- Menghapus semua konfigurasi replikasi dan mengarahkan
-- semua traffic ke primary (single instance).

-- Hapus routing function
DROP FUNCTION IF EXISTS get_read_endpoint;
DROP FUNCTION IF EXISTS check_replication_lag;

-- Hapus tabel
DROP TABLE IF EXISTS replication_health_log;
DROP TABLE IF EXISTS replication_config;

-- Catatan: Bagian server-side (replication user, WAL config, pg_hba)
-- harus di-revert manual:
-- 1. Hapus replicator user: DROP USER replicator;
-- 2. Kembalikan wal_level ke minimal
-- 3. Hapus baris dari pg_hba.conf
-- 4. Restart PostgreSQL
