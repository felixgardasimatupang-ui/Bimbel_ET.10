import { Users, Clock } from 'lucide-react';
import type { Teacher, Schedule } from '../types';
import AvatarWithFallback from './AvatarWithFallback';

interface PengajarPanelProps {
  teachers: Teacher[];
  schedules: Schedule[];
  evalTeacherId: string;
  setEvalTeacherId: (id: string) => void;
  pedagogicalScore: number;
  setPedagogicalScore: (val: number) => void;
  professionalScore: number;
  setProfessionalScore: (val: number) => void;
  socialScore: number;
  setSocialScore: (val: number) => void;
  evalFeedback: string;
  setEvalFeedback: (val: string) => void;
  onSubmitEvaluation: (e: React.FormEvent) => void;
}

export default function PengajarPanel({
  teachers, schedules, evalTeacherId, setEvalTeacherId,
  pedagogicalScore, setPedagogicalScore,
  professionalScore, setProfessionalScore,
  socialScore, setSocialScore,
  evalFeedback, setEvalFeedback, onSubmitEvaluation
}: PengajarPanelProps) {
  return (
    <div id="panel_pengajar" className="space-y-4 flex flex-col flex-1">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Jadwal Sesi Pembelajaran Aktif Hari Ini</h3>
            <span className="text-[10px] text-slate-500 font-mono">{schedules.length} Sesi Terjadwal</span>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-96 pr-1">
            {schedules.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic">Tidak ada jadwal terdaftar.</p>
            ) : schedules.map((sch) => (
              <div key={sch.id} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/60 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-700/30 hover:-translate-y-0.5 transition-all duration-200">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-800">{sch.classTitle}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${
                      sch.status === 'SEDANG_BERLANGSUNG' ? 'bg-red-100 text-red-700 animate-pulse' :
                      sch.status === 'AKAN_DATANG' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>{sch.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1 font-mono">
                    <span className="flex items-center gap-0.5"><Users className="w-3 h-3 text-slate-400" />{sch.teacherName}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5"><Clock className="w-3 h-3 text-slate-400" />{sch.startTime} - {sch.endTime} WIB</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-blue-600 block">{sch.roomCode}</span>
                  <span className="text-[9px] text-slate-400 font-mono block">Offline HQ</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Evaluasi Berkala & Efisiensi Pengajar</h3>
            <form id="evaluation_form" onSubmit={onSubmitEvaluation} className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">Pilih Pengajar</label>
                  <select id="eval_teacher_select" value={evalTeacherId} onChange={(e) => setEvalTeacherId(e.target.value)}
                    className="w-full text-xs px-2 py-1 border border-slate-200 rounded bg-white text-slate-700">
                    {teachers.map((t: Teacher) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div>
                    <label className="block text-[8px] text-slate-400 uppercase font-bold text-center">Pedagogis</label>
                    <input id="eval_pedagogic" type="number" min="1" max="5" value={pedagogicalScore}
                      onChange={(e) => { const v = Math.min(5, Math.max(1, Number(e.target.value) || 1)); setPedagogicalScore(v); }}
                      className="w-full text-center p-1 bg-white border rounded text-xs" />
                  </div>
                  <div>
                    <label className="block text-[8px] text-slate-400 uppercase font-bold text-center">Profesional</label>
                    <input id="eval_professional" type="number" min="1" max="5" value={professionalScore}
                      onChange={(e) => { const v = Math.min(5, Math.max(1, Number(e.target.value) || 1)); setProfessionalScore(v); }}
                      className="w-full text-center p-1 bg-white border rounded text-xs" />
                  </div>
                  <div>
                    <label className="block text-[8px] text-slate-400 uppercase font-bold text-center">Sosial</label>
                    <input id="eval_social" type="number" min="1" max="5" value={socialScore}
                      onChange={(e) => { const v = Math.min(5, Math.max(1, Number(e.target.value) || 1)); setSocialScore(v); }}
                      className="w-full text-center p-1 bg-white border rounded text-xs" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">Catatan Kinerja & Evaluasi Guru *</label>
                <input id="eval_feedback_input" type="text"
                  placeholder="Contoh: Sangat interaktif dalam mengajarkan integral aljabar..."
                  value={evalFeedback} onChange={(e) => setEvalFeedback(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded text-xs" />
              </div>
              <button id="btn_submit_evaluation" type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-1 px-2 rounded text-[11px] text-center">
                Simpan Evaluasi & Rekalkulasi Rating Berkala
              </button>
            </form>

            <div className="mt-3 space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peringkat & Skor Guru Terpercaya</h4>
              {teachers.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">Belum ada data pengajar.</p>
              ) : teachers.map((t: Teacher) => (
                <div key={t.id} className="p-2 border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-100/50 dark:bg-slate-800/30 text-xs flex justify-between items-center hover:bg-slate-100 dark:hover:bg-slate-700/30 hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <AvatarWithFallback src={t.avatar} alt={`Foto ${t.name}`} className="w-8 h-8 rounded-full object-cover bg-slate-200 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">{t.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono block">Sub: {t.subjects.join(', ')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-blue-600 block">Rating: ★ {t.rating.toFixed(1)}/5.0</span>
                    <span className="text-[9px] text-slate-500 font-mono block">Kehadiran Mengajar: {t.attendanceRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
