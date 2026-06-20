import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Memuat data...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
      <p className="text-xs font-medium">{message}</p>
    </div>
  );
}
