import { AlertTriangle } from 'lucide-react';

export default function HakAksesPanel() {
  return (
    <div id="panel_hak_akses" className="space-y-4 flex flex-col flex-1">
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Matriks Ketat Kontrol Akses Peran Pengguna (RBAC)</h3>
        <p className="text-[10px] text-slate-400 mb-3.5">EduAdmin Bimbel memperkuat sistem penegakan akses demi menjaga integritas data keuangan SPP dan penilaian akademik siswa.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-200">
            <thead className="bg-slate-900 text-white font-bold text-[9px] uppercase">
              <tr>
                <th className="p-3 border">KEMAMPUAN FITUR SISTEM</th>
                <th className="p-3 border text-center">ADMINISTRATOR</th>
                <th className="p-3 border text-center">GURU / TUTOR</th>
                <th className="p-3 border text-center">WALI MURID</th>
                <th className="p-3 border text-center">SISWA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              <tr>
                <td className="p-3 border font-semibold text-slate-700">Mengelola data keuangan bimbel & SPP</td>
                <td className="p-3 border text-center text-emerald-600 font-bold bg-slate-50">✓ FULL ACCESS</td>
                <td className="p-3 border text-center text-slate-400">✗ TERKUNCI</td>
                <td className="p-3 border text-center text-slate-500">LIHAT LUNAS</td>
                <td className="p-3 border text-center text-slate-400">✗ TERKUNCI</td>
              </tr>
              <tr>
                <td className="p-3 border font-semibold text-slate-700">Mengevaluasi Kinerja Guru Berkala</td>
                <td className="p-3 border text-center text-emerald-600 font-bold bg-slate-50">✓ FULL ACCESS</td>
                <td className="p-3 border text-center text-slate-400">✗ TERKUNCI</td>
                <td className="p-3 border text-center text-slate-400">✗ TERKUNCI</td>
                <td className="p-3 border text-center text-slate-400">✗ TERKUNCI</td>
              </tr>
              <tr>
                <td className="p-3 border font-semibold text-slate-700">Absensi Scan QR & Lokasi GPS</td>
                <td className="p-3 border text-center text-slate-500">LIHAT DATA</td>
                <td className="p-3 border text-center text-blue-600 font-bold bg-slate-50">✓ MANIFEST</td>
                <td className="p-3 border text-center text-slate-500">LIHAT LAPORAN</td>
                <td className="p-3 border text-center text-indigo-600 font-bold bg-slate-50">✓ SCAN AKTIF</td>
              </tr>
              <tr>
                <td className="p-3 border font-semibold text-slate-700">Unggah Materi Belajar Premium</td>
                <td className="p-3 border text-center text-emerald-600 font-bold">✓ FULL ACCESS</td>
                <td className="p-3 border text-center text-blue-600 font-bold bg-slate-50">✓ UNGGAH</td>
                <td className="p-3 border text-center text-slate-400">✗ TERKUNCI</td>
                <td className="p-3 border text-center text-slate-500">✗ LIHAT PDF SAJA</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-slate-700 mt-4 flex items-start gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <span className="font-bold text-slate-800 block">Bagaimana Cara Menguji Kontrol Keamanan?</span>
            <span className="text-[10px] text-slate-600">Anda dapat mengubah peran akses Anda melalui menu dropdown [Kontrol Peran Aktif] di pojok kiri atas bilah navigasi. Perubahan peran visual ini merefleksikan otorisasi pengeditan data di panel secara dinamis.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
