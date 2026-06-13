import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AuditLogsApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Filter, RefreshCw, Radio, Wifi, WifiOff } from 'lucide-react';
import type { AuditLog } from '../types';

type ActionFilter = 'Semua' | 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'REGISTER' | 'CHECKIN' | 'EVALUATE' | 'SEED';
type EntityFilter = 'Semua' | 'user' | 'student' | 'teacher' | 'transaction' | 'material' | 'notification' | 'schedule' | 'quiz' | 'attendance';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  UPDATE: 'bg-blue-100 text-blue-800 border-blue-200',
  DELETE: 'bg-red-100 text-red-800 border-red-200',
  LOGIN: 'bg-purple-100 text-purple-800 border-purple-200',
  REGISTER: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  CHECKIN: 'bg-amber-100 text-amber-800 border-amber-200',
  EVALUATE: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  SEED: 'bg-slate-100 text-slate-800 border-slate-200',
};

const ACTION_ICONS: Record<string, string> = {
  CREATE: '+',
  UPDATE: '~',
  DELETE: '✕',
  LOGIN: '→',
  REGISTER: '⊕',
  CHECKIN: '✓',
  EVALUATE: '★',
  SEED: '●',
};

export default function AuditLogPanel() {
  const { user: authUser } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<ActionFilter>('Semua');
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('Semua');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [liveConnected, setLiveConnected] = useState(false);
  const [liveEntries, setLiveEntries] = useState<AuditLog[]>([]);
  const liveIndicatorRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await AuditLogsApi.list({
        action: actionFilter === 'Semua' ? undefined : actionFilter,
        entity: entityFilter === 'Semua' ? undefined : entityFilter,
        page: p,
        limit: 25,
      });
      if (res.success && res.data) {
        setLogs(res.data.data as unknown as AuditLog[]);
        setTotalPages((res.data.pagination as Record<string, number>)?.totalPages || 1);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter]);

  useEffect(() => {
    fetchLogs(page);
  }, [fetchLogs, page]);

  // Real-time subscription via Supabase Realtime
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('audit-logs-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        (payload) => {
          const newLog = payload.new as AuditLog;
          setLiveEntries((prev) => [newLog, ...prev].slice(0, 10));
          // Flash indicator
          if (liveIndicatorRef.current) {
            liveIndicatorRef.current.classList.add('animate-pulse');
            setTimeout(() => liveIndicatorRef.current?.classList.remove('animate-pulse'), 1000);
          }
        }
      )
      .subscribe((status) => {
        setLiveConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase?.removeChannel(channel);
    };
  }, []);

  const displayedLogs = [...liveEntries, ...logs].slice(0, 50);

  const refresh = () => {
    setLiveEntries([]);
    fetchLogs(page);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  const currentUserRole = authUser?.role || 'ADMIN';
  if (currentUserRole !== 'ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        <Activity className="w-12 h-12 mx-auto mb-2 text-slate-300" />
        <p>Akses ditolak. Hanya ADMIN yang dapat melihat audit log.</p>
      </div>
    );
  }

  return (
    <div id="panel_audit" className="space-y-3 flex flex-col flex-1">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Audit Log Real-time
            </h3>
            <div
              ref={liveIndicatorRef}
              className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full transition-all ${
                liveConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {liveConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{liveConnected ? 'LIVE' : 'DISCONNECTED'}</span>
            </div>
            {liveEntries.length > 0 && (
              <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                +{liveEntries.length} baru
              </span>
            )}
          </div>
          <button
            onClick={refresh}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-blue-600 transition px-2 py-1 rounded hover:bg-slate-100"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-3 h-3 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value as ActionFilter); setPage(1); setLiveEntries([]); }}
            className="text-[10px] px-2 py-1 border border-slate-200 rounded bg-white text-slate-700 font-medium"
          >
            <option value="Semua">Semua Aksi</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="REGISTER">REGISTER</option>
            <option value="CHECKIN">CHECKIN</option>
            <option value="EVALUATE">EVALUATE</option>
            <option value="SEED">SEED</option>
          </select>
          <select
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value as EntityFilter); setPage(1); setLiveEntries([]); }}
            className="text-[10px] px-2 py-1 border border-slate-200 rounded bg-white text-slate-700 font-medium"
          >
            <option value="Semua">Semua Entitas</option>
            <option value="user">User</option>
            <option value="student">Siswa</option>
            <option value="teacher">Pengajar</option>
            <option value="transaction">Transaksi</option>
            <option value="material">Materi</option>
            <option value="notification">Notifikasi</option>
            <option value="schedule">Jadwal</option>
            <option value="quiz">Kuis</option>
            <option value="attendance">Presensi</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex-1 overflow-hidden flex flex-col">
        <div ref={scrollRef} className="overflow-x-auto overflow-y-auto flex-1 max-h-[65vh]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-900 text-white font-bold text-[9px] uppercase sticky top-0 z-10">
              <tr>
                <th className="p-2.5 border-b border-slate-700 w-36">Waktu</th>
                <th className="p-2.5 border-b border-slate-700 w-20">Aksi</th>
                <th className="p-2.5 border-b border-slate-700 w-20">Entitas</th>
                <th className="p-2.5 border-b border-slate-700 w-28">User</th>
                <th className="p-2.5 border-b border-slate-700">Detail</th>
                <th className="p-2.5 border-b border-slate-700 w-24">ID Entitas</th>
                <th className="p-2.5 border-b border-slate-700 w-20">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 text-[11px]">
                    <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-slate-300" />
                    Memuat data audit...
                  </td>
                </tr>
              ) : displayedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 text-[11px]">
                    <Activity className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                    Belum ada data audit log.
                  </td>
                </tr>
              ) : displayedLogs.map((log, idx) => {
                const isLive = idx < liveEntries.length;
                return (
                  <tr
                    key={`${log.id}-${idx}`}
                    className={`hover:bg-slate-50 transition-colors ${
                      isLive ? 'bg-emerald-50/50 border-l-2 border-l-emerald-500' : ''
                    }`}
                  >
                    <td className="p-2 text-[10px] text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                        {formatTime(log.createdAt)}
                      </div>
                    </td>
                    <td className="p-2">
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold border ${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-700'}`}>
                        <span>{ACTION_ICONS[log.action] || '?'}</span>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-2 text-[10px] text-slate-600 font-semibold">{log.entity}</td>
                    <td className="p-2 text-[10px] text-slate-600 max-w-[120px] truncate" title={log.user?.name || 'Sistem'}>
                      {log.user ? (
                        <span className="flex flex-col">
                          <span className="font-bold text-slate-800">{log.user.name}</span>
                          <span className="text-[8px] text-slate-400">{log.user.role}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Sistem</span>
                      )}
                    </td>
                    <td className="p-2 text-[10px] text-slate-600 max-w-[250px] truncate" title={log.details || ''}>
                      {log.details || '-'}
                    </td>
                    <td className="p-2 text-[9px] text-slate-400 max-w-[120px] truncate">{log.entityId || '-'}</td>
                    <td className="p-2 text-[9px] text-slate-400">{log.ip || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 bg-slate-50 text-[10px]">
            <span className="text-slate-500">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 font-bold hover:bg-slate-100"
              >
                Sebelumnya
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 font-bold hover:bg-slate-100"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Real-time status bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-sm flex items-center justify-between text-[9px] text-slate-400">
        <div className="flex items-center gap-2">
          <Radio className="w-3 h-3" />
          <span>Supabase Realtime:</span>
          <span className={`font-bold ${liveConnected ? 'text-emerald-600' : 'text-red-500'}`}>
            {liveConnected ? 'TERHUBUNG' : 'TERPUTUS'}
          </span>
          <span className="text-slate-300">|</span>
          <span>Entri tampil: {displayedLogs.length}</span>
          <span className="text-slate-300">|</span>
          <span>Live antrian: {liveEntries.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <Wifi className={`w-3 h-3 ${liveConnected ? 'text-emerald-500' : 'text-red-400'}`} />
          <span className={liveConnected ? 'text-emerald-600' : 'text-red-400'}>
            {liveConnected ? 'WebSocket AKTIF' : 'Reconnect...'}
          </span>
        </div>
      </div>
    </div>
  );
}
