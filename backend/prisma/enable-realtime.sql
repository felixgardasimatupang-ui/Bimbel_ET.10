-- Jalankan SQL ini di Supabase SQL Editor (https://supabase.com/dashboard/project/gqmlkanhjmwicqgceycq/sql/new)
-- untuk mengaktifkan Realtime pada tabel audit_logs.
-- Project: https://wbdcibeejnziwfpskpzn.supabase.co

-- 1. Pastikan tabel audit_logs ada di publikasi Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;

-- 2. Verifikasi
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- 3. Atau jika publikasi belum ada:
-- CREATE PUBLICATION supabase_realtime FOR TABLE audit_logs;
