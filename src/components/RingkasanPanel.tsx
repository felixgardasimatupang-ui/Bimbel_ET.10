import React from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Area
} from 'recharts';
import {
  Sparkles, QrCode, MapPin, UserCheck, Bell
} from 'lucide-react';
import type { Siswa, Notifikasi } from '../types';
import AvatarWithFallback from './AvatarWithFallback';
import EmptyState from './ui/EmptyState';

interface RingkasanPanelProps {
  siswas: Siswa[];
  notifs: Notifikasi[];
  selectedSiswaId: string;
  setSelectedSiswaId: (id: string) => void;
  performanceTrendData: Array<{
    name: string; RataNilai: number; Kehadiran: number; SPP_Pemasukan: number;
  }>;
  onSimulateCheckin: (siswaId: string, method: 'QR_SCAN' | 'LOKASI') => void;
  onToggleSpp: (siswaId: string) => void;
  currentUserRole: string;
}

export default function RingkasanPanel({
  siswas, notifs, selectedSiswaId, setSelectedSiswaId,
  performanceTrendData, onSimulateCheckin, onToggleSpp, currentUserRole: _currentUserRole
}: RingkasanPanelProps) {
  const selectedSiswaObj = siswas.find((s: Siswa) => s.id === selectedSiswaId) || siswas[0] || null;

  return (
    <div id="panel_ringkasan" className="space-y-4 flex flex-col flex-1">
      <div className="grid grid-cols-12 gap-4 animate-fadeIn">
        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Visualisasi Analitik Komparatif Real-Time</h3>
              <p className="text-[10px] text-slate-400">Hubungan kemajuan performa nilai rata-rata siswa dan tren rekonsiliasi SPP bulanan</p>
            </div>
            <div className="flex gap-2 bg-slate-50 border border-slate-200 p-1 rounded font-mono text-[9px]">
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2 my-auto bg-blue-500 rounded-sm"></span> Rata-Rata Nilai
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2 my-auto bg-emerald-500 rounded-sm"></span> SPP Terbayar (IDR)
              </span>
            </div>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={performanceTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                <YAxis yAxisId="left" stroke="#3b82f6" fontSize={9} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={9} />
                <Tooltip contentStyle={{ fontSize: '10px', backgroundColor: '#fff', borderRadius: '6px' }} />
                <Area yAxisId="right" type="monotone" dataKey="SPP_Pemasukan" fill="#e6f4ea" stroke="#10b981" strokeWidth={2} name="SPP (Rp)" />
                <Bar yAxisId="left" dataKey="RataNilai" barSize={25} fill="#3b82f6" radius={[2, 2, 0, 0]} name="Rata-rata Nilai" />
                <Line yAxisId="left" type="monotone" dataKey="Kehadiran" stroke="#f59e0b" strokeWidth={2} name="Persentase Keberhasilan (%)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
              <span>Log Trigger Push Notifikasi</span>
              <span className="bg-amber-100 text-amber-700 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded">Siswa & Wali</span>
            </h3>

            <div className="space-y-2 overflow-y-auto max-h-52 pr-1">
              {notifs.length === 0 ? (
                <EmptyState icon={<Bell className="w-6 h-6" />} title="Belum ada notifikasi" description="Notifikasi SPP dan pengingat ujian akan muncul di sini." />
              ) : notifs.map((n: Notifikasi) => (
                  <div key={n.id}
                  className={`p-2 rounded-lg border text-[11px] transition-all duration-200 hover:-translate-x-0.5 ${
                    n.type === 'SPP_INFO' ? 'bg-amber-50/60 border-amber-100 text-slate-800' :
                    n.type === 'UJIAN_INFO' ? 'bg-red-50/60 border-red-100 text-slate-800' :
                    'bg-blue-50/60 border-blue-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-slate-900 mb-0.5">
                    <span className="truncate">{n.title}</span>
                    <span className="text-[8px] text-slate-400 font-mono">{new Date(n.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-normal line-clamp-2">{n.message}</p>
                  <div className="flex items-center gap-2 mt-1 text-[8px] text-slate-400">
                    <span className="bg-slate-200 text-slate-800 px-1 rounded uppercase font-bold">{n.targetRole}</span>
                    <span>•</span>
                    <span>Instat Push Sent</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 mt-2 text-[10px] text-slate-500 font-semibold space-y-1 bg-slate-50 p-2 rounded">
            <div className="flex justify-between">
              <span>Status Push Server:</span>
              <span className="text-emerald-600 font-mono">ONLINE_DISPATCH</span>
            </div>
            <div className="flex justify-between">
              <span>Wali Murid Online:</span>
              <span className="text-blue-600 font-mono">{siswas.filter((s: Siswa) => s.locationCheckedIn).length} Parent Connected</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 mb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Dasbor Analitik Perkembangan Siswa Secara Mendalam & Personal</span>
            </h3>
            <p className="text-[10px] text-slate-400">Pilih nama siswa di bawah untuk mendiagnosis rapor kehadiran, nilai, serta grafik bulanan privat.</p>
          </div>
          <div className="mt-2 sm:mt-0">
            <select
              id="siswa_deep_dive_selector"
              value={selectedSiswaId}
              onChange={(e) => setSelectedSiswaId(e.target.value)}
              className="text-xs px-2 py-1.5 border border-slate-200 rounded bg-white text-slate-700 font-semibold focus:ring-1 focus:ring-blue-500"
            >
              {siswas.map((s: Siswa) => (
                <option key={s.id} value={s.id}>{s.name} ({s.classLevel})</option>
              ))}
            </select>
          </div>
        </div>

        {selectedSiswaObj ? (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700 hover:shadow-sm transition-all duration-200">
              <div className="flex items-center gap-3 mb-3">
                <AvatarWithFallback
                  src={selectedSiswaObj.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                  alt={`Foto ${selectedSiswaObj.name}`}
                  className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm bg-blue-100 shrink-0"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{selectedSiswaObj.name}</h4>
                  <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded uppercase block mt-0.5">{selectedSiswaObj.classLevel}</span>
                  <span className="text-[9px] text-slate-500 block font-mono mt-0.5">{selectedSiswaObj.email}</span>
                </div>
              </div>

              <div className="space-y-2 text-[10px] text-slate-600 border-t border-slate-200/60 pt-2.5">
                <div className="flex justify-between">
                  <span>Kontak Orang Tua:</span>
                  <span className="font-bold text-slate-800">{selectedSiswaObj.parentName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email Orang Tua:</span>
                  <span className="font-mono text-slate-500 block truncate max-w-[130px]">{selectedSiswaObj.parentEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya SPP Sekolah:</span>
                  <span className="font-bold text-slate-800">Rp {selectedSiswaObj.sppAmount.toLocaleString('id-ID')}/bln</span>
                </div>
                <div className="flex justify-between items-center bg-white p-1.5 rounded border border-slate-200">
                  <span>Status Invoice SPP:</span>
                  <button
                    id={`spp_toggle_${selectedSiswaObj.id}`}
                    onClick={() => onToggleSpp(selectedSiswaObj.id)}
                    title="Klik untuk mengubah status tagihan langsung"
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition ${
                      selectedSiswaObj.sppStatus === 'LUNAS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800 hover:bg-slate-200'
                    }`}
                  >
                    {selectedSiswaObj.sppStatus === 'LUNAS' ? '● TERBAYAR (LUNAS)' : '⚠️ BELUM BAYAR (BAYAR)'}
                  </button>
                </div>
              </div>
            </div>

            <div className="col-span-12 md:col-span-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700 hover:shadow-sm transition-all duration-200">
              <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Evaluasi Penilaian Mata Pelajaran Akademik</h4>
              <div className="space-y-2">
                {selectedSiswaObj.subjectsScore.map((sub: { name: string; score: number }, idx: number) => (
                  <div key={idx} className="bg-white p-2 rounded border border-slate-100">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-semibold text-slate-700">{sub.name}</span>
                      <span className="font-mono font-bold text-blue-600">{sub.score} / 100</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          sub.score >= 90 ? 'bg-emerald-500' :
                          sub.score >= 80 ? 'bg-blue-500' :
                          sub.score >= 70 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${sub.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-12 md:col-span-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700 hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Integrasi GPS & Scan Attendance Terpaut</h4>
                <div className="space-y-1.5 text-[11px] text-slate-600">
                  <div className="bg-white p-2 rounded border border-slate-100 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-600">
                      <QrCode className="w-3.5 h-3.5 text-purple-600" />
                      <span>Batas Check-in Harian:</span>
                    </span>
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1 rounded">{selectedSiswaObj.checkInTime || '07:45'} WIB</span>
                  </div>

                  <div className="bg-white p-2 rounded border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        <span>Log Absensi Lokasi:</span>
                      </span>
                      <span className={`text-[10px] font-bold ${selectedSiswaObj.locationCheckedIn ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {selectedSiswaObj.locationCheckedIn ? 'HADIR (RADIUS)' : 'ABSEN / PENDING'}
                      </span>
                    </div>
                    {selectedSiswaObj.locationCheckedIn ? (
                      <div className="text-[9px] text-slate-500 font-mono border-t border-slate-100 pt-1 mt-1">
                        <div>Jam Masuk: {selectedSiswaObj.checkInTime || '07:44'}</div>
                        <div>Koordinat: {selectedSiswaObj.latitude?.toFixed(4)}, {selectedSiswaObj.longitude?.toFixed(4)}</div>
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded inline-block mt-1">Valid dalam radius 15m (Bimbel HQ)</span>
                      </div>
                    ) : (
                      <div className="text-[9px] text-slate-400 font-mono mt-1">
                        Gagal melacak dalam koordinat HQ. Silakan presensi menggunakan scan berkas QR atau verifikasi manual oleh Guru.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  id={`btn_simulate_attend_ringkasan_${selectedSiswaObj.id}`}
                  onClick={() => onSimulateCheckin(selectedSiswaObj.id, 'QR_SCAN')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1 px-2 rounded flex items-center justify-center gap-1 shadow transition"
                >
                  <UserCheck className="w-3 h-3" />
                  <span>Simulasi Kehadiran Masuk ({selectedSiswaObj.name})</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState title="Tidak ada data siswa" description="Daftarkan siswa baru di panel Siswa & QR Presensi." />
        )}
      </div>
    </div>
  );
}
