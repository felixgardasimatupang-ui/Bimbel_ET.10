import { useEffect, useState } from 'react';
import { Users, DollarSign, QrCode, Award } from 'lucide-react';
import type { Siswa, Teacher } from '../types';

interface StatsStripProps {
  siswas: Siswa[];
  teachers: Teacher[];
  totalSPPCollected: number;
  percentSPPCollected: number;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(() => process.env.NODE_ENV === 'test' ? value : 0);
  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      setDisplay(value);
      return;
    }
    const duration = 600;
    const steps = 20;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return <>{display}</>;
}

export default function StatsStrip({ siswas, teachers, totalSPPCollected, percentSPPCollected }: StatsStripProps) {
  const checkedInCount = siswas.filter((s: Siswa) => s.locationCheckedIn).length;
  const attendancePct = siswas.length > 0 ? Math.round((checkedInCount / siswas.length) * 100) : 0;
  const avgRating = teachers.length > 0
    ? (teachers.reduce((acc: number, t: Teacher) => acc + t.rating, 0) / teachers.length).toFixed(1)
    : '0.0';
  const avgPerformance = siswas.length > 0
    ? Math.round(siswas.reduce((acc: number, s: Siswa) => acc + s.performanceScore, 0) / siswas.length)
    : 0;

  return (
    <div id="stats_strip" className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0 animate-stagger">
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
        <div>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Siswa Aktif</span>
          <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 tracking-tight block mt-0.5">
            <AnimatedNumber value={siswas.length} />
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-emerald-600 font-semibold mt-1">
          <span>Rata-rata Nilai: <span className="animate-countUp inline-block">{avgPerformance}</span></span>
          <Users className="w-3.5 h-3.5 text-blue-500" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
        <div>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Pendapatan SPP (Juni)</span>
          <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 tracking-tight block mt-0.5">
            Rp <AnimatedNumber value={totalSPPCollected} />
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
          <span className="font-bold text-blue-600"><AnimatedNumber value={percentSPPCollected} />% Terbayar</span>
          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
        <div>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Kehadiran (QR & GPS)</span>
          <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 tracking-tight block mt-0.5">
            <AnimatedNumber value={attendancePct} />%
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
          <span className="text-emerald-500 font-bold">Auto-Sync</span>
          <QrCode className="w-3.5 h-3.5 text-purple-500" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
        <div>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Avg Evaluasi Guru</span>
          <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 tracking-tight block mt-0.5">
            {avgRating}/5.0
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-blue-600 font-semibold mt-1">
          <span>Operasional Efisien</span>
          <Award className="w-3.5 h-3.5 text-amber-500 font-mono" />
        </div>
      </div>
    </div>
  );
}
