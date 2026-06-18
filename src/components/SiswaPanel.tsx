import React, { useOptimistic, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Search, Plus, X, QrCode, MapPin, UserCheck, Target
} from 'lucide-react';
import type { Siswa } from '../types';
import AvatarWithFallback from './AvatarWithFallback';
import { useSiswaPanel } from '../contexts/SiswaPanelContext';
import { TableSkeleton } from './Skeleton';

export default function SiswaPanel() {
  const {
    filteredSiswas, selectedSiswaId, setSelectedSiswaId,
    studentSearch, setStudentSearch, studentClassFilter, setStudentClassFilter,
    newSiswaOpen, setNewSiswaOpen, formDataSiswa, setFormDataSiswa, onAddSiswa,
    qrSession, onRegenerateQr, gpsLoading, gpsLocation, onGpsQuery,
    onSimulateCheckin, onToggleSpp,
  } = useSiswaPanel();

  const [optimisticSiswas, addOptimistic] = useOptimistic(
    filteredSiswas as Siswa[],
    (state, { type, id }: { type: 'toggleSpp' | 'checkin'; id: string }) => {
      if (type === 'toggleSpp') {
        return state.map((s) =>
          s.id === id ? { ...s, sppStatus: s.sppStatus === 'LUNAS' ? 'BELUM_BAYAR' as const : 'LUNAS' as const } : s
        );
      }
      if (type === 'checkin') {
        return state.map((s) =>
          s.id === id
            ? { ...s, locationCheckedIn: true, checkInTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }
            : s
        );
      }
      return state;
    },
  );

  const tableRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: optimisticSiswas.length,
    getScrollElement: () => tableRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  return (
    <div id="panel_siswa" className="space-y-4 flex flex-col flex-1">
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            <input
              id="search_siswa_input"
              type="text"
              placeholder="Cari Budi, Siti, Rina atau ID..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full pl-8 pr-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-500 text-slate-700"
            />
          </div>
          <select
            id="filter_siswa_level"
            value={studentClassFilter}
            onChange={(e) => setStudentClassFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
          >
            <option value="Semua">Semua Jenjang Kelas</option>
            <option value="12 SMA">12 SMA</option>
            <option value="11 SMA">11 SMA</option>
            <option value="10 SMA">10 SMA</option>
          </select>
        </div>
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button
            id="btn_open_student_modal"
            onClick={() => setNewSiswaOpen(!newSiswaOpen)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Daftarkan Siswa Baru</span>
          </button>
        </div>
      </div>

      {newSiswaOpen && (
        <form id="student_register_form" onSubmit={onAddSiswa} className="bg-slate-900 text-white border border-slate-800 rounded-lg p-4 animate-fadeIn space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
              <UserCheck className="w-4 h-4" />
              <span>Form Pendaftaran Siswa & Sinkronisasi Wali Murid</span>
            </h3>
            <button type="button" onClick={() => setNewSiswaOpen(false)} aria-label="Tutup form pendaftaran" className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Nama Siswa Lengkap *</label>
              <input id="form_siswa_name" type="text" required placeholder="Contoh: Raden Sutan"
                value={formDataSiswa.name}
                onChange={(e) => setFormDataSiswa({...formDataSiswa, name: e.target.value})}
                className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Jenjang & Jurusan *</label>
              <select id="form_siswa_class" value={formDataSiswa.classLevel}
                onChange={(e) => setFormDataSiswa({...formDataSiswa, classLevel: e.target.value})}
                className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white">
                <option value="12 SMA - IPA">12 SMA - IPA</option>
                <option value="12 SMA - IPS">12 SMA - IPS</option>
                <option value="11 SMA - IPA">11 SMA - IPA</option>
                <option value="11 SMA - IPS">11 SMA - IPS</option>
                <option value="10 SMA">10 SMA</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Surel Aktif (Siswa) *</label>
              <input id="form_siswa_email" type="email" required placeholder="raden@siswa.edu"
                value={formDataSiswa.email}
                onChange={(e) => setFormDataSiswa({...formDataSiswa, email: e.target.value})}
                className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Nama Wali Murid *</label>
              <input id="form_siswa_parent_name" type="text" placeholder="Nama Bapak/Ibu"
                value={formDataSiswa.parentName}
                onChange={(e) => setFormDataSiswa({...formDataSiswa, parentName: e.target.value})}
                className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Surel Wali Murid *</label>
              <input id="form_siswa_parent_email" type="email" placeholder="bapak@parent.com"
                value={formDataSiswa.parentEmail}
                onChange={(e) => setFormDataSiswa({...formDataSiswa, parentEmail: e.target.value})}
                className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Spp Sesi (IDR) *</label>
              <input id="form_siswa_spp" type="number"
                value={formDataSiswa.sppAmount}
                onChange={(e) => setFormDataSiswa({...formDataSiswa, sppAmount: Number(e.target.value)})}
                className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white" />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setNewSiswaOpen(false)} className="px-3 py-1 bg-slate-800 rounded text-xs text-slate-300">Batal</button>
            <button type="submit" id="btn_submit_student" className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold">Simpan & Sync</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-5 bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <QrCode className="w-4 h-4 text-purple-600" />
                <span>Sistem Presensi Generator QR Dan Lokasi GPS</span>
              </h3>
              <button id="btn_regenerate_qr" onClick={onRegenerateQr} className="text-[10px] text-blue-600 hover:underline font-mono">
                [ Ganti Kode Sesi ]
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded p-2.5 text-center flex flex-col items-center">
              <p className="text-[10px] text-slate-500 font-semibold mb-1">PINDAI QR DIBAWAH ATAU VERIFIKASI SEBELUM 08.00</p>
              <div className="w-32 h-32 bg-white border-2 border-slate-200 rounded p-1 flex flex-col justify-between relative overflow-hidden shadow-inner my-2">
                <div className="flex justify-between h-4">
                  <div className="w-4 h-4 bg-slate-900 border border-slate-700 rounded-sm"></div>
                  <div className="w-1.5 h-1 bg-slate-500 rounded"></div>
                  <div className="w-4 h-4 bg-slate-900 border border-slate-700 rounded-sm"></div>
                </div>
                <div className="flex-1 flex flex-col justify-around py-2 px-1">
                  <div className="h-0.5 bg-slate-800 w-11/12 mx-auto"></div>
                  <div className="h-0.5 bg-slate-800 w-2/3"></div>
                  <div className="h-0.5 bg-slate-800 w-3/4 mx-auto"></div>
                  <div className="h-0.5 bg-slate-800 w-11/12"></div>
                  <div className="h-0.5 bg-slate-800 w-5/6"></div>
                </div>
                <div className="flex justify-between h-4">
                  <div className="w-4 h-4 bg-slate-900 border border-slate-700 rounded-sm"></div>
                  <div className="w-4 h-1.5 bg-slate-400 rounded-sm"></div>
                  <div className="w-4 h-4 bg-slate-900 border border-slate-700 rounded-sm"></div>
                </div>
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500 opacity-60 animate-pulse"></div>
              </div>
              <div className="mt-1">
                <span className="text-[11px] font-bold text-slate-800 block leading-tight">{qrSession.courseName}</span>
                <span className="text-[9px] text-slate-400 font-mono block">KODE: {qrSession.code} ({qrSession.generatedAt} WIB)</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded p-2.5 mt-2 text-[11px] text-slate-600">
              <div className="font-bold text-blue-900 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span>Koordinat Lokasi Kampus Les</span>
              </div>
              <p className="text-[10px] text-slate-600 leading-normal mt-0.5">Lokasi: <b>{gpsLocation ? `${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lon.toFixed(4)}` : '-6.2088, 106.8456 (HQ Jakarta)'}</b>. Presensi GPS wajib diaktifkan oleh siswa di zona radius max 20 meter.</p>
              <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-blue-200">
                <button id="btn_gps_test" type="button" onClick={onGpsQuery} disabled={gpsLoading}
                  className="bg-white hover:bg-blue-100 border border-blue-300 px-2 py-0.5 rounded text-[10px] text-blue-700 font-bold flex items-center gap-1 transition">
                  <Target className="w-2.5 h-2.5" />
                  {gpsLoading ? 'Mencari Satelit...' : 'Validasi Kedekatan Lokasi Anda'}
                </button>
                {gpsLocation && (
                  <span className="text-[9px] font-mono text-emerald-700 font-bold">
                    Lock: {gpsLocation.lat.toFixed(4)}, {gpsLocation.lon.toFixed(4)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3.5 mt-2.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Simulasi Cepat Presensi</h4>
            <div className="grid grid-cols-2 gap-1.5">
              <select id="simulation_student_selector" className="text-xs border border-slate-200 bg-white p-1 rounded font-semibold"
                onChange={(e) => { if (e.target.value) { addOptimistic({ type: 'checkin', id: e.target.value }); onSimulateCheckin(e.target.value, 'QR_SCAN'); e.target.value = ''; } }}>
                <option value="">-- Simulasi QR Scan --</option>
                {optimisticSiswas.map((s: Siswa) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
              <select id="simulation_student_gps_selector" className="text-xs border border-slate-200 bg-white p-1 rounded font-semibold"
                onChange={(e) => { if (e.target.value) { addOptimistic({ type: 'checkin', id: e.target.value }); onSimulateCheckin(e.target.value, 'LOKASI'); e.target.value = ''; } }}>
                <option value="">-- Simulasi Geolocation --</option>
                {optimisticSiswas.map((s: Siswa) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">Siswa & Laporan Kehadiran Berdasar QR-GPS</span>
            <span className="text-[10px] text-slate-500 font-mono">Filter Hasil: {optimisticSiswas.length}</span>
          </div>

          <div ref={tableRef} data-testid="virtual-scroll-container" className="flex-1 overflow-y-auto" style={{ maxHeight: '65vh' }}>
            {optimisticSiswas.length === 0 ? (
              <TableSkeleton rows={5} cols={6} />
            ) : (
              <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-[9px] uppercase font-bold text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="p-3" style={{ width: '10%' }}>ID SISWA</th>
                      <th className="p-3" style={{ width: '22%' }}>NAMA</th>
                      <th className="p-3" style={{ width: '18%' }}>PRESENSI HARI INI</th>
                      <th className="p-3" style={{ width: '16%' }}>KEHADIRAN</th>
                      <th className="p-3" style={{ width: '14%' }}>NILAI</th>
                      <th className="p-3 text-right" style={{ width: '20%' }}>INVOICE SPP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {virtualizer.getVirtualItems().map((virtualItem) => {
                      const student = optimisticSiswas[virtualItem.index] as Siswa;
                      return (
                        <tr
                          key={student.id}
                          data-index={virtualItem.index}
                          onClick={() => setSelectedSiswaId(student.id)}
                          style={{ height: `${virtualItem.size}px`, transform: `translateY(${virtualItem.start}px)` }}
                          className={`hover:bg-slate-50/80 cursor-pointer transition absolute w-full ${selectedSiswaId === student.id ? 'bg-blue-50/40 border-l-2 border-blue-600' : ''}`}
                        >
                          <td className="p-3 font-mono font-bold text-slate-500">{student.id}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <AvatarWithFallback src={student.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} alt={student.name} className="w-6 h-6 rounded-full object-cover shadow-sm shrink-0" />
                              <div>
                                <span className="font-semibold text-slate-800 block text-[11px]">{student.name}</span>
                                <span className="text-[9px] text-slate-400 block">{student.classLevel}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            {student.locationCheckedIn ? (
                              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono block w-fit">HADIR ({student.checkInTime || '07:44'})</span>
                            ) : (
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono block w-fit">TERLAMBAT / ABSEN</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold">{student.attendanceRate}%</span>
                              <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden" role="progressbar" aria-valuenow={student.attendanceRate} aria-valuemin={0} aria-valuemax={100}>
                                <div className="bg-purple-500 h-full" style={{ width: `${student.attendanceRate}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`font-mono font-extrabold ${student.performanceScore >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>{student.performanceScore}</span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              id={`spp_badge_${student.id}`}
                              onClick={(e) => { e.stopPropagation(); addOptimistic({ type: 'toggleSpp', id: student.id }); onToggleSpp(student.id); }}
                              className={`text-[9px] font-extrabold px-2 py-0.5 rounded transition ${student.sppStatus === 'LUNAS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                            >
                              {student.sppStatus === 'LUNAS' ? 'LUNAS' : 'BELUM BAYAR'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
