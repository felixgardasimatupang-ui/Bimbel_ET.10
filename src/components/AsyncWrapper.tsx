import type { ReactNode } from 'react';
import { Loader2, AlertCircle, Inbox } from 'lucide-react';

interface AsyncWrapperProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
}

export default function AsyncWrapper({
  loading = false,
  error = null,
  empty = false,
  emptyMessage = 'Tidak ada data',
  emptyIcon,
  onRetry,
  children,
}: AsyncWrapperProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
        <p className="text-sm font-medium">Memuat data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400" role="alert">
        <AlertCircle className="w-10 h-10 mb-3 text-red-400" />
        <p className="text-sm font-medium text-red-600 mb-1">Gagal memuat data</p>
        <p className="text-xs text-slate-500 mb-3">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Coba Lagi
          </button>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        {emptyIcon || <Inbox className="w-10 h-10 mb-3 text-slate-300" />}
        <p className="text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}
