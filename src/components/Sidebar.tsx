import {
  ShieldCheck, Cpu, RefreshCw, Users, Calendar, DollarSign,
  BookOpen, Wifi, WifiOff, Lock, Award, LogOut
} from 'lucide-react';
import type { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: 'ringkasan' | 'siswa' | 'pengajar' | 'spp' | 'modul' | 'hak_akses') => void;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  offlineMode: boolean;
  toggleOfflineMode: () => void;
  isSyncing: boolean;
  pendingSyncCount: number;
  syncLogs: string[];
  siswaCount: number;
  materiCount: number;
  quizCount: number;
  userName: string;
  onLogout: () => void;
}

export default function Sidebar({
  activeTab, setActiveTab, currentUserRole, setCurrentUserRole,
  offlineMode, toggleOfflineMode, isSyncing, pendingSyncCount, syncLogs,
  siswaCount, materiCount, quizCount, userName, onLogout
}: SidebarProps) {

  const handleNavKeyDown = (e: React.KeyboardEvent, tab: 'ringkasan' | 'siswa' | 'pengajar' | 'spp' | 'modul' | 'hak_akses') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveTab(tab);
    }
  };

  const navItem = (id: string, tab: 'ringkasan' | 'siswa' | 'pengajar' | 'spp' | 'modul' | 'hak_akses', icon: React.ReactNode, label: string, badge?: React.ReactNode) => (
    <button
      id={`nav_${id}`}
      onClick={() => setActiveTab(tab)}
      onKeyDown={(e) => handleNavKeyDown(e, tab)}
      role="tab"
      aria-selected={activeTab === tab}
      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[11px] font-medium transition-colors ${
        activeTab === tab
          ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-600 font-bold'
          : 'hover:bg-slate-800 text-slate-300'
      }`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
      {badge}
      {tab === 'ringkasan' && isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />}
    </button>
  );

  return (
    <aside id="sidebar" aria-label="Panel navigasi samping" className="w-56 bg-slate-900 flex flex-col shrink-0 text-slate-300 border-r border-slate-800">
      <div id="sidebar_header" className="p-4 border-b border-slate-800 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white relative shadow-sm">
          <Award className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-sm font-bold text-white leading-tight">EduAdmin Bimbel</h1>
          <span className="text-[10px] opacity-60">Admin Les Khusus v2.6</span>
        </div>
      </div>

      <div id="role_control_panel" className="px-3 pt-3 pb-2 bg-slate-950/60 border-b border-slate-800/80">
        <div className="text-[9px] font-semibold text-slate-400 uppercase px-2 mb-1 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Kontrol Peran Aktif</span>
        </div>
        <select
          id="role_selector"
          value={currentUserRole}
          onChange={(e) => setCurrentUserRole(e.target.value as UserRole)}
          className="w-full text-[11px] px-2 py-1 bg-slate-800 text-white border border-slate-700 rounded font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="ADMIN">ADMINISTRATOR (Full)</option>
          <option value="GURU">GURU / TUTOR (Akses Presensi & Materi)</option>
          <option value="WALI_MURID">WALI MURID (Keuangan & Rapor Personal)</option>
          <option value="SISWA">SISWA (Kuis, Lokasi & Modul Belajar)</option>
        </select>
        <div className="mt-1 px-2 text-[9px] text-slate-500 font-mono flex items-center justify-between">
          <span>Status:</span>
          <span className="text-emerald-400 font-bold tracking-wider">SECURE_SSL</span>
        </div>
      </div>

      <nav id="sidebar_nav" aria-label="Panel Navigasi Utama" className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        <div className="text-[9px] font-semibold text-slate-500 uppercase px-2 mb-1 tracking-wider">Dashboard Utama</div>

        {navItem('ringkasan', 'ringkasan', <Cpu className="w-3.5 h-3.5" />, 'Ringkasan Performa')}
        {navItem('siswa', 'siswa', <Users className="w-3.5 h-3.5" />, 'Siswa & QR Presensi',
          <span className="bg-blue-900/60 text-blue-300 px-1 py-[1px] text-[8px] rounded font-mono font-bold">{siswaCount}</span>)}
        {navItem('pengajar', 'pengajar', <Calendar className="w-3.5 h-3.5" />, 'Jadwal & Evaluasi Guru')}

        <div className="pt-3 text-[9px] font-semibold text-slate-500 uppercase px-2 mb-1 tracking-wider">Keuangan & Materi</div>

        {navItem('spp', 'spp', <DollarSign className="w-3.5 h-3.5" />, 'Laporan SPP & Beban')}
        {navItem('modul', 'modul', <BookOpen className="w-3.5 h-3.5" />, 'Modul Belajar & Kuis',
          <span className="bg-emerald-950 text-emerald-400 px-1 py-[1px] text-[8px] rounded font-bold">{materiCount + quizCount}</span>)}

        <div className="pt-3 text-[9px] font-semibold text-slate-500 uppercase px-2 mb-1 tracking-wider">Sistem & Keamanan</div>

        <button
          id="nav_hak_akses"
          onClick={() => setActiveTab('hak_akses')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab('hak_akses'); } }}
          role="tab"
          aria-selected={activeTab === 'hak_akses'}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[11px] font-medium transition-colors ${
            activeTab === 'hak_akses'
              ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-600 font-bold'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Matriks Hak Akses</span>
          </div>
        </button>

        <button
          id="nav_sync"
          onClick={toggleOfflineMode}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleOfflineMode(); } }}
          aria-label={offlineMode ? 'Aktifkan mode online' : 'Aktifkan mode offline'}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded text-[11px] font-medium transition-colors hover:bg-slate-800 text-slate-300"
        >
          <div className="flex items-center gap-2">
            {offlineMode ? <WifiOff className="w-3.5 h-3.5 text-red-400" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
            <span>Mode Offline</span>
          </div>
          <span className={`text-[9px] ${offlineMode ? 'text-amber-400' : 'text-emerald-400'}`}>
            {offlineMode ? 'STANDBY' : 'AKTIF'}
          </span>
        </button>
      </nav>

      <div id="sync_history_list" className="p-3 bg-slate-950/80 border-t border-slate-800/80 text-[9px] font-mono">
        <div className="flex items-center justify-between text-slate-400 mb-1 font-bold">
          <span>Terminal Live Logs:</span>
          {pendingSyncCount > 0 && (
            <span className="text-amber-400 animate-pulse font-bold">+{pendingSyncCount} offline changes</span>
          )}
        </div>
        <div className="h-20 overflow-y-auto space-y-1 text-slate-500">
          {syncLogs.map((log: string, index: number) => (
            <div key={`${index}-${log.slice(0, 20)}`} className="line-clamp-2 leading-normal break-all">{log}</div>
          ))}
        </div>
      </div>

      <div id="user_profile_box" className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs uppercase shadow-sm">
          {currentUserRole[0]}
        </div>
        <div className="flex flex-col overflow-hidden flex-1">
          <span className="text-[11px] font-semibold text-white truncate">{userName}</span>
          <span className="text-[9px] text-slate-400 font-mono truncate">{currentUserRole} - Bimbel HQ</span>
        </div>
        <button
          onClick={onLogout}
          title="Keluar"
          aria-label="Logout"
          className="p-1 rounded hover:bg-red-800/30 text-slate-400 hover:text-red-400 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
