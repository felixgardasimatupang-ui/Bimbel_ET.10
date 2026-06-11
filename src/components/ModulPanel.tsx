import React from 'react';
import { Search, Plus, X, FileText, Video, Layers, Lock } from 'lucide-react';
import type { MateriBelajar, InteractiveQuiz } from '../types';

interface ModulPanelProps {
  filteredMateris: MateriBelajar[];
  materiSearch: string;
  setMateriSearch: (val: string) => void;
  materiSubjectFilter: string;
  setMateriSubjectFilter: (val: string) => void;
  newMateriOpen: boolean;
  setNewMateriOpen: (val: boolean) => void;
  formDataMateri: {
    title: string; subject: string; targetLevel: string;
    type: 'PDF' | 'VIDEO' | 'TUGAS'; isLocked: boolean;
  };
  setFormDataMateri: React.Dispatch<React.SetStateAction<{
    title: string; subject: string; targetLevel: string;
    type: 'PDF' | 'VIDEO' | 'TUGAS'; isLocked: boolean;
  }>>;
  onAddMateri: (e: React.FormEvent) => void;
  onDownload: (id: string) => void;
  quizzes: InteractiveQuiz[];
  activeQuizPlay: InteractiveQuiz | null;
  quizAnswers: Record<string, number>;
  quizResult: { score: number; total: number } | null;
  onStartQuiz: (quiz: InteractiveQuiz) => void;
  onSelectAnswer: (qId: string, optIndex: number) => void;
  onSubmitQuiz: () => void;
  onCloseQuiz: () => void;
  currentUserRole: string;
  activeStudentName: string;
}

export default function ModulPanel({
  filteredMateris, materiSearch, setMateriSearch, materiSubjectFilter, setMateriSubjectFilter,
  newMateriOpen, setNewMateriOpen, formDataMateri, setFormDataMateri, onAddMateri, onDownload,
  quizzes, activeQuizPlay, quizAnswers, quizResult,
  onStartQuiz, onSelectAnswer, onSubmitQuiz, onCloseQuiz, currentUserRole,
  activeStudentName
}: ModulPanelProps) {
  return (
    <div id="panel_modul" className="space-y-4 flex flex-col flex-1">
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col md:flex-row gap-2.5 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            <input id="materi_search_input" type="text" placeholder="Cari materi rumus cepat, video, PDF..."
              value={materiSearch} onChange={(e) => setMateriSearch(e.target.value)}
              className="w-full pl-8 pr-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700" />
          </div>
          <select id="filter_materi_subject" value={materiSubjectFilter}
            onChange={(e) => setMateriSubjectFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded px-2 py-1 bg-white">
            <option value="Semua">Semua Mata Pelajaran</option>
            <option value="Matematika">Matematika</option>
            <option value="Fisika">Fisika</option>
            <option value="Kimia">Kimia</option>
            <option value="Bahasa Inggris">Bahasa Inggris</option>
          </select>
        </div>
        <button id="btn_open_materi_modal" onClick={() => setNewMateriOpen(!newMateriOpen)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" />
          <span>Unggah Materi Belajar</span>
        </button>
      </div>

      {newMateriOpen && (
        <form id="upload_materi_form" onSubmit={onAddMateri} className="bg-slate-900 text-white border border-slate-800 rounded-lg p-4 animate-fadeIn space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>Unggah Modul Belajar & Akses Kontrol Peran</span>
            </h3>
            <button type="button" onClick={() => setNewMateriOpen(false)} aria-label="Tutup form unggah materi" className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Judul Topik / Lembar Kerja *</label>
              <input id="form_materi_title" type="text" required placeholder="Contoh: Rumus Cepat Integral Trigonometri"
                value={formDataMateri.title} onChange={(e) => setFormDataMateri({...formDataMateri, title: e.target.value})}
                className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Mata Pelajaran *</label>
              <select id="form_materi_subject" value={formDataMateri.subject}
                onChange={(e) => setFormDataMateri({...formDataMateri, subject: e.target.value})}
                className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white">
                <option value="Matematika">Matematika</option>
                <option value="Fisika">Fisika</option>
                <option value="Kimia">Kimia</option>
                <option value="Bahasa Inggris">Bahasa Inggris</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Format Berkas *</label>
              <select id="form_materi_type" value={formDataMateri.type}
                onChange={(e) => setFormDataMateri({...formDataMateri, type: e.target.value as 'PDF' | 'VIDEO' | 'TUGAS'})}
                className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white">
                <option value="PDF">PDF (Dokumen)</option>
                <option value="VIDEO">MP4 (Video Pembahasan)</option>
                <option value="TUGAS">DOCX / TUGAS</option>
              </select>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Tingkat Kelas Sasaran *</label>
              <input id="form_materi_level" type="text" placeholder="Contoh: 12 SMA atau Siswa Umum"
                value={formDataMateri.targetLevel} onChange={(e) => setFormDataMateri({...formDataMateri, targetLevel: e.target.value})}
                className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white" />
            </div>
            <div className="flex items-center gap-2 pt-4">
              <input id="form_materi_locked" type="checkbox" checked={formDataMateri.isLocked}
                onChange={(e) => setFormDataMateri({...formDataMateri, isLocked: e.target.checked})}
                className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-700 rounded" />
              <label className="text-[11px] text-slate-300 font-bold uppercase select-none flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                Akses Terkunci (Khusus Premium)
              </label>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setNewMateriOpen(false)} className="px-3 py-1 bg-slate-800 rounded text-xs text-slate-300">Batal</button>
            <button type="submit" id="btn_submit_materi" className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold">Terbitkan Modul</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7 bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Sistem Repository Pembelajaran Terintegrasi Kelompok</h3>
              <span className="text-[10px] text-slate-500 font-mono">{filteredMateris.length} Berkas Materi</span>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filteredMateris.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">Tidak ada materi ditemukan.</p>
              ) : filteredMateris.map((mat: MateriBelajar) => (
                <div key={mat.id} className="p-2.5 rounded-lg border border-slate-200 flex justify-between items-center bg-slate-50/60 hover:bg-slate-50 transition text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center font-bold text-blue-600 shrink-0">
                      {mat.type === 'PDF' && <FileText className="w-4 h-4 text-red-500" />}
                      {mat.type === 'VIDEO' && <Video className="w-4 h-4 text-emerald-500" />}
                      {mat.type === 'TUGAS' && <Layers className="w-4 h-4 text-amber-500" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 text-[11px]">{mat.title}</span>
                        {mat.isLocked && (
                          <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.2 rounded font-sans flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5 text-amber-700" /> Premium
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono block mt-0.5">MP: {mat.subject} | Tingkat: {mat.targetLevel} | Diunggah: {mat.uploadDate}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-500 block">{mat.downloadsCount}x Diunduh</span>
                    <button id={`download_btn_${mat.id}`} onClick={() => onDownload(mat.id)}
                      className="text-[10px] hover:underline text-blue-600 font-semibold">Unduh Materi</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-100 p-2.5 rounded border mt-3 text-[10px] text-slate-500 font-mono flex justify-between">
            <span>Akses Siswa: {currentUserRole === 'SISWA' ? 'LOCK_PREVENTED (Siswa)' : 'ADMIN_GRANT_FULL'}</span>
            <span>Wajib Sinkron Sebelum Ujian</span>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Simulasi Kuis Interaktif & Diagnostic</h3>
            {!activeQuizPlay ? (
              <div className="space-y-3">
                <p className="text-[10px] text-slate-400">Pilih salah satu kuis aktif untuk diputar. Hasil kuis instan diintegrasikan ke sistem penilaian siswa yang terpilih di menu Ringkasan Utama.</p>
                {quizzes.map((qz) => (
                  <div key={qz.id} className="p-2.5 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between text-xs transition">
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">{qz.title}</span>
                      <span className="text-[9px] text-slate-500 font-mono block">Sub: {qz.subject} • Kelas: {qz.classLevel}</span>
                    </div>
                    <button id={`play_quiz_${qz.id}`} onClick={() => onStartQuiz(qz)}
                      className="bg-slate-900 text-white hover:bg-slate-800 font-bold px-2.5 py-1 rounded text-[10px]">
                      Mainkan Kuis ★
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 animate-fadeIn space-y-3">
                <div className="flex justify-between items-center border-b pb-1.5">
                  <span className="font-bold text-slate-800 text-[11px]">{activeQuizPlay.title}</span>
                  <button onClick={onCloseQuiz} aria-label="Tutup kuis" className="text-slate-400 font-bold">X</button>
                </div>
                {activeQuizPlay.questions.map((q, qIndex) => (
                  <div key={q.id} className="space-y-1.5">
                    <p className="font-semibold text-slate-800">{qIndex + 1}. {q.question}</p>
                    <div className="space-y-1">
                      {q.options.map((opt: string, optIndex: number) => (
                        <button id={`q_option_${q.id}_${optIndex}`} key={optIndex} type="button"
                          onClick={() => onSelectAnswer(q.id, optIndex)}
                          className={`w-full text-left p-2 rounded border text-[11px] transition ${
                            quizAnswers[q.id] === optIndex ? 'bg-blue-600 text-white border-blue-700' : 'bg-white hover:bg-slate-100'
                          }`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {!quizResult ? (
                  <button id="btn_submit_answers" onClick={onSubmitQuiz}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded text-[11px]">
                    Kirim Jawaban Kuis
                  </button>
                ) : (
                  <div className="bg-emerald-100 text-emerald-800 p-2.5 rounded text-center">
                    <span className="text-xs font-bold block">Hasil Kuis: {quizResult.score}%</span>
                    <p className="text-[9px] text-slate-600 mt-1">Status Penilaian: Nilai berhasil diskalakan langsung ke rapor privat siswa terpilih!</p>
                    <button id="btn_close_quiz_result" onClick={onCloseQuiz}
                      className="mt-2 text-[10px] text-blue-600 underline font-bold">
                      Selesai & Tutup Kuis
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="p-2 border-t mt-3.5 bg-slate-50 font-mono text-[9px] text-slate-400">
            Siswa teraktif saat ini: <b>{activeStudentName}</b>
          </div>
        </div>
      </div>
    </div>
  );
}
