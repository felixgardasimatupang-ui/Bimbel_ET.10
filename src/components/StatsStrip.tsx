import { Users, DollarSign, QrCode, Award } from 'lucide-react';
import type { Siswa, Teacher } from '../types';

interface StatsStripProps {
  siswas: Siswa[];
  teachers: Teacher[];
  totalSPPCollected: number;
  percentSPPCollected: number;
}

export default function StatsStrip({ siswas, teachers, totalSPPCollected, percentSPPCollected }: StatsStripProps) {
  const checkedInCount = siswas.filter((s: Siswa) => s.locationCheckedIn).length;
  const attendancePct = siswas.length > 0 ? Math.round((checkedInCount / siswas.length) * 100) : 0;
  const avgRating = teachers.length > 0
    ? (teachers.reduce((acc: number, t: Teacher) => acc + t.rating, 0) / teachers.length).toFixed(1)
    : '0.0';

  return (
    <div id="stats_strip" className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Siswa Aktif</span>
          <span className="text-xl font-bold font-mono text-slate-800 tracking-tight block mt-0.5">{siswas.length}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-emerald-600 font-semibold mt-1">
          <span>+12% Bulan ini</span>
          <Users className="w-3.5 h-3.5 text-blue-500" />
        </div>
      </div>

      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pendapatan SPP (Juni)</span>
          <span className="text-xl font-bold font-mono text-slate-800 tracking-tight block mt-0.5">
            Rp {totalSPPCollected.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
          <span className="font-bold text-blue-600">{percentSPPCollected}% Terbayar</span>
          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
        </div>
      </div>

      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Kehadiran (QR & GPS)</span>
          <span className="text-xl font-bold font-mono text-slate-800 tracking-tight block mt-0.5">{attendancePct}%</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
          <span className="text-emerald-500 font-bold">Auto-Sync</span>
          <QrCode className="w-3.5 h-3.5 text-purple-500" />
        </div>
      </div>

      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Avg Evaluasi Guru</span>
          <span className="text-xl font-bold font-mono text-slate-800 tracking-tight block mt-0.5">{avgRating}/5.0</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-blue-600 font-semibold mt-1">
          <span>Operasional Efisien</span>
          <Award className="w-3.5 h-3.5 text-amber-500 font-mono" />
        </div>
      </div>
    </div>
  );
}
