-- Migration: Setup Read-Heavy Replication
-- Deskripsi: Migrasi dari monolitik ke arsitektur primary-replica
-- untuk memisahkan beban baca (read) dan tulis (write).
-- 
-- Migration Plan:
-- 1. Buat replication user di primary
-- 2. Konfigurasi primary untuk WAL (Write-Ahead Log) replication
-- 3. Buat tabel routing config untuk read/write split
-- 4. Buat function untuk health-check replication lag
-- 
-- Catatan: Bagian 1-2 dijalankan via psql di server, bukan migrasi biasa.

-- ============================================
-- BAGIAN 1: Konfigurasi Primary (via psql)
-- ============================================

-- Buat replication user
-- CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'secure_password_here';
-- GRANT CONNECT ON DATABASE bimbel TO replicator;

-- Konfigurasi postgresql.conf
-- wal_level = replica
-- max_wal_senders = 5
-- wal_keep_size = 1024  -- MB

-- Konfigurasi pg_hba.conf
-- host replication replicator <replica_ip>/32 md5

-- ============================================
-- BAGIAN 2: Setup di Aplikasi (via migration)
-- ============================================

-- Table untuk konfigurasi routing baca/tulis
CREATE TABLE IF NOT EXISTS replication_config (
    id SERIAL PRIMARY KEY,
    primary_host VARCHAR(255) NOT NULL,
    replica_hosts JSONB NOT NULL DEFAULT '[]',
    replication_lag_threshold_seconds INT NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table untuk log health-check replication
CREATE TABLE IF NOT EXISTS replication_health_log (
    id SERIAL PRIMARY KEY,
    replica_host VARCHAR(255) NOT NULL,
    lag_bytes BIGINT,
    lag_seconds INT,
    is_healthy BOOLEAN NOT NULL DEFAULT true,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_replication_health_replica ON replication_health_log(replica_host, checked_at DESC);

-- Function untuk mengecek replication lag
CREATE OR REPLACE FUNCTION check_replication_lag()
RETURNS TABLE (
    replica_host TEXT,
    lag_seconds INT,
    is_healthy BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Query ini dijalankan di setiap replica untuk cek lag
    -- Di replica: SELECT now() - pg_last_xact_replay_timestamp() AS lag;
    -- Sederhananya, kita catat sebagai placeholder
    RETURN QUERY
    SELECT
        rh.replica_host::TEXT,
        rh.lag_seconds,
        rh.is_healthy
    FROM replication_health_log rh
    WHERE rh.checked_at > NOW() - INTERVAL '5 minutes'
    ORDER BY rh.checked_at DESC;
END;
$$;

-- Function untuk failover: arahkan laporan finansial ke primary
CREATE OR REPLACE FUNCTION get_read_endpoint(report_type TEXT DEFAULT 'standard')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_host TEXT;
    v_lag INT;
BEGIN
    -- Laporan finansial WAJIB ke primary (zero tolerance untuk inkonsistensi)
    IF report_type = 'financial' THEN
        SELECT primary_host INTO v_host FROM replication_config WHERE is_active = true LIMIT 1;
        RETURN COALESCE(v_host, 'primary');
    END IF;

    -- Laporan biasa boleh ke replica, cek health dulu
    SELECT lag_seconds INTO v_lag
    FROM replication_health_log
    ORDER BY checked_at DESC LIMIT 1;

    IF v_lag IS NULL OR v_lag > 30 THEN
        -- Lag terlalu tinggi, fallback ke primary
        SELECT primary_host INTO v_host FROM replication_config WHERE is_active = true LIMIT 1;
        RETURN COALESCE(v_host, 'primary');
    END IF;

    -- Pilih replica secara round-robin (sederhana)
    RETURN 'replica';
END;
$$;

-- Seed konfigurasi awal
INSERT INTO replication_config (primary_host, replica_hosts, replication_lag_threshold_seconds)
VALUES ('primary.bimbel.internal', '["replica-1.bimbel.internal", "replica-2.bimbel.internal"]', 30);
