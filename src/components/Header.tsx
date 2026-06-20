import { DollarSign, Bell, Download, RefreshCw, Menu } from 'lucide-react';

interface HeaderProps {
  offlineMode: boolean;
  pendingSyncCount: number;
  onSync: () => void;
  onSPPReminder: () => void;
  onExamReminder: () => void;
  onExportCSV: () => void;
  onToggleSidebar?: () => void;
}

export default function Header({
  offlineMode, pendingSyncCount, onSync, onSPPReminder, onExamReminder, onExportCSV, onToggleSidebar
}: HeaderProps) {
  return (
    <header id="header_pane" className="h-12 bg-white border-b border-slate-200 px-2 sm:px-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleSidebar && (
          <button onClick={onToggleSidebar} aria-label="Toggle sidebar" className="md:hidden p-1.5 hover:bg-slate-100 rounded text-slate-600">
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-[11px] font-medium">
          <span className={`w-2 h-2 rounded-full ${offlineMode ? 'bg-red-400 animate-pulse' : 'bg-emerald-500'}`}></span>
          <span className="text-slate-600 font-semibold uppercase">
            {offlineMode ? 'Offline Standby (Local Queue)' : 'Real-time Cloud Sync Active'}
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200"></div>

        <div className="hidden lg:flex items-center gap-1 text-[10px] text-slate-400 font-mono">
          Server: <span className="text-slate-600 bg-slate-100 rounded px-1.5 py-0.5">JKT-NODE-01</span>
        </div>

        {pendingSyncCount > 0 && (
          <button
            id="btn_sync_now"
            onClick={onSync}
            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-mono px-2 py-0.5 rounded animate-pulse"
          >
            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
            <span>Sinkronisasi Sekarang ({pendingSyncCount})</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 border border-slate-200 rounded p-0.5 bg-slate-50">
          <button
            id="btn_noti_spp"
            onClick={onSPPReminder}
            title="Kirim pengingat SPP otomatis ke orang tua murid yang belum lunas"
            aria-label="Picu Pengingat SPP"
            className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 rounded text-[10px] font-semibold flex items-center gap-1 transition shadow-sm"
          >
            <DollarSign className="w-3 h-3 text-amber-500" />
            <span className="hidden sm:inline">Picu Pengingat SPP</span>
          </button>

          <button
            id="btn_noti_exam"
            onClick={onExamReminder}
            title="Siarkan pengingat ujian try-out ke seluruh siswa"
            aria-label="Pengingat Ujian"
            className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-600 border border-slate-200 rounded text-[10px] font-semibold flex items-center gap-1 transition shadow-sm"
          >
            <Bell className="w-3 h-3 text-emerald-500" />
            <span className="hidden sm:inline">Pengingat Ujian</span>
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200"></div>

        <button
          id="btn_export_csv"
          onClick={onExportCSV}
          aria-label="Ekspor CSV"
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-blue-400" />
          <span>Ekspor CSV</span>
        </button>
      </div>
    </header>
  );
}
