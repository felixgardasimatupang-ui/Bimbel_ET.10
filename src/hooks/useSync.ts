import { useState, useCallback } from 'react';

import { apiRequest } from '../api/client';

export function useSync(triggerToast: (message: string, type: 'success' | 'warn' | 'info') => void) {
  const [offlineMode, setOfflineMode] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([
    'Sistem terhubung ke server.',
  ]);

  const addSyncLog = useCallback((action: string) => {
    const time = new Date().toLocaleTimeString('id-ID');
    setSyncLogs((prev) => [`[${time}] ${action}`, ...prev.slice(0, 8)]);
  }, []);

  const trackOfflineChange = useCallback(() => {
    if (offlineMode) setPendingSyncCount((prev) => prev + 1);
  }, [offlineMode]);

  const handleSyncData = useCallback(async () => {
    setIsSyncing(true);
    triggerToast('Menyinkronkan data ke server...', 'info');
    try {
      const res = await apiRequest('/students', { method: 'GET' });
      if (res.success) {
        setPendingSyncCount(0);
        triggerToast('Sinkronisasi berhasil! Data diperbarui dari server.', 'success');
        addSyncLog('Data berhasil disinkronkan dengan server.');
      } else {
        triggerToast('Gagal sinkronisasi: ' + (res.error || 'unknown'), 'warn');
      }
    } catch {
      triggerToast('Gagal terhubung ke server untuk sinkronisasi.', 'warn');
    } finally {
      setIsSyncing(false);
    }
  }, [triggerToast, addSyncLog]);

  const toggleOfflineMode = useCallback(() => {
    setOfflineMode((prev) => {
      if (!prev) {
        triggerToast('Mode OFFLINE aktif. Perubahan akan diantrekan.', 'warn');
        addSyncLog('Offline mode activated.');
      } else {
        triggerToast('Mode ONLINE. Menyinkronkan data...', 'success');
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
  };
}
