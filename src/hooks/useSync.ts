import { useState, useCallback, useRef, useEffect } from 'react';

export function useSync(triggerToast: (message: string, type: 'success' | 'warn' | 'info') => void) {
  const [offlineMode, setOfflineMode] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([
    'Sistem diinisialisasi pada server node JKT-NODE-01',
    'Sinkronisasi database awan berhasil. Status: Konsisten',
  ]);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, []);

  const addSyncLog = useCallback((action: string) => {
    const time = new Date().toLocaleTimeString('id-ID');
    setSyncLogs((prev) => [`[${time}] ${action}`, ...prev.slice(0, 8)]);
  }, []);

  const trackOfflineChange = useCallback(() => {
    if (offlineMode) setPendingSyncCount((prev) => prev + 1);
  }, [offlineMode]);

  const handleSyncData = useCallback(() => {
    setIsSyncing(true);
    triggerToast('Menyambungkan terminal dan mensinkronisasikan revisi offline...', 'info');
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      setIsSyncing(false);
      setPendingSyncCount(0);
      triggerToast('Sinkronisasi real-time berhasil! Semua instansi data wali murid & server terpadu.', 'success');
      addSyncLog('Penyelarasan basis data multi-perangkat dikonsolidasi dengan server JKT-MAIN-NODE.');
    }, 1500);
  }, [triggerToast, addSyncLog]);

  const toggleOfflineMode = useCallback(() => {
    setOfflineMode((prev) => {
      if (!prev) {
        triggerToast('Beralih ke MODE OFFLINE. Aktivitas terekam dalam antrean sinkronisasi lokal.', 'warn');
        addSyncLog('Offline standby protocols activated. Using ServiceWorker mock queue.');
      } else {
        triggerToast('Koneksi Internet pulih! Menyinkronkan tumpukan rekam data siswa...', 'success');
        handleSyncData();
      }
      return !prev;
    });
  }, [triggerToast, addSyncLog, handleSyncData]);

  return {
    offlineMode, setOfflineMode,
    pendingSyncCount, setPendingSyncCount,
    isSyncing, setIsSyncing,
    syncLogs,
    addSyncLog,
    trackOfflineChange,
    handleSyncData,
    toggleOfflineMode,
    syncTimer,
  };
}
