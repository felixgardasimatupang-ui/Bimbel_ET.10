import { useState } from 'react';
import type { Transaksi, BiayaOperasional } from '../types';
import LoadingState from './ui/LoadingState';
import EmptyState from './ui/EmptyState';
import ErrorState from './ui/ErrorState';
import { Receipt, RefreshCw } from 'lucide-react';

interface SppPanelProps {
  transactions: Transaksi[];
  totalSPPCollected: number;
}

const OPERATIONAL_COSTS: BiayaOperasional[] = [
  { id: "OP-001", itemName: "Biaya Sewa Gedung & Listrik Kelas", totalCost: 12000000, siswaShare: 30000, description: "Sewa gedung, pemeliharaan AC, dan token listrik belajar.", category: "FASILITAS" },
  { id: "OP-002", itemName: "Infrastruktur Internet Serat Optik 100Mbps", totalCost: 1500000, siswaShare: 3750, description: "Koneksi Wifi kecepatan tinggi untuk siswa belajar, streaming kuis, & sinkronisasi absensi real-time.", category: "UTILITAS" },
  { id: "OP-003", itemName: "Materi Cetak & Modul Digital Berwarna", totalCost: 4000000, siswaShare: 10000, description: "Pembelian lisensi soal kurikulum nasional terbaru serta cetak materi intensif mingguan.", category: "KURIKULUM" },
  { id: "OP-004", itemName: "Gaji Pokok & Tunjangan Operator Sistem & Resepsionis", totalCost: 10500000, siswaShare: 26250, description: "Admin operasional harian yang mengurus kehadiran QR, keluhan wali, & kebersihan bimbel.", category: "GAJI" },
];

export default function SppPanel({ transactions, totalSPPCollected }: SppPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalOperationalCost = OPERATIONAL_COSTS.reduce((sum, item) => sum + item.totalCost, 0);
  const costPerSiswaCalculated = OPERATIONAL_COSTS.reduce((sum, b) => sum + b.siswaShare, 0);

  const refresh = () => {
    setLoading(true);
    setError(null);
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <div id="panel_spp" className="space-y-4 flex flex-col flex-1">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span>Sistem Manajemen Biaya Operasional Transparan Bagi Wali Murid</span>
              <span className="bg-emerald-100 text-emerald-800 font-mono text-[9px] font-bold px-2 py-0.2 rounded">Beban Transparan</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 mb-2">Kas operasional bulanan sekolah yang disinkronisasi secara akurat dan dibagi rata per siswa untuk pertanggungjawaban kas yang bersih.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 font-bold text-slate-500 uppercase text-[9px] border-b border-slate-200">
                <tr>
                  <th className="p-2.5">NAMA KEBUTUHAN OPERASIONAL</th>
                  <th className="p-2.5 text-right">TOTAL BIAYA</th>
                  <th className="p-2.5 text-right">SHARE PER SISWA</th>
                  <th className="p-2.5 text-center">KATEGORI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {OPERATIONAL_COSTS.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-sans font-semibold text-slate-800 text-[11px]">{b.itemName}</td>
                    <td className="p-2.5 text-right font-bold text-slate-700">Rp {b.totalCost.toLocaleString('id-ID')}</td>
                    <td className="p-2.5 text-right font-bold text-blue-600">Rp {b.siswaShare.toLocaleString('id-ID')}</td>
                    <td className="p-2.5 text-center">
                      <span className="bg-slate-200 text-slate-800 text-[8px] font-bold px-1.5 py-0.2 rounded font-sans uppercase">{b.category}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3.5 bg-slate-900 text-slate-300 p-2.5 rounded-lg flex items-center justify-between text-xs font-mono">
            <div>
              <span className="block font-sans font-bold text-white text-[11px]">Akumulasi Beban Per Siswa / Bulan</span>
              <span className="text-[9px] text-slate-400">Total operational divided collectively</span>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-emerald-500 block">Rp {costPerSiswaCalculated.toLocaleString('id-ID')}</span>
              <span className="text-[9px] text-slate-400 font-sans">Sisa Kas: Re-investasi Fasilitas</span>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
              <span>Buku Besar Transaksi Keuangan Bimbel</span>
              <button onClick={refresh} className="text-[10px] font-bold text-slate-500 hover:text-blue-600 transition flex items-center gap-1" aria-label="Refresh transaksi">
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </h3>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {loading ? (
                <LoadingState message="Memuat transaksi..." />
              ) : error ? (
                <ErrorState message={error} onRetry={refresh} />
              ) : transactions.length === 0 ? (
                <EmptyState icon={<Receipt className="w-6 h-6" />} title="Belum ada transaksi" description="Transaksi SPP akan muncul setelah siswa melakukan pembayaran." />
              ) : transactions.map((tx: Transaksi) => (
                <div key={tx.id} className="p-2 border border-slate-100 rounded bg-slate-50/60 hover:bg-slate-50 transition text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800 text-[11px] block">{tx.payeeName}</span>
                    <span className="text-[9px] text-slate-500 font-mono block">Tgl: {tx.date} | Ket: {tx.notes}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold block ${tx.type === 'SPP_MASUK' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {tx.type === 'SPP_MASUK' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[8px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded uppercase inline-block">{tx.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 mt-2 text-[10px] text-slate-500 font-semibold space-y-1 bg-slate-50 p-2 rounded">
            <div className="flex justify-between">
              <span>Total SPP Masuk Bulan Ini:</span>
              <span className="text-emerald-600 font-bold font-mono">Rp {totalSPPCollected.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Beban Operasional:</span>
              <span className="text-red-500 font-bold font-mono">Rp {totalOperationalCost.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
