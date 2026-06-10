import { CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'warn' | 'info';
}

export default function Toast({ message, type }: ToastProps) {
  const bgClass =
    type === 'success' ? 'bg-emerald-500 text-white border-emerald-600' :
    type === 'warn' ? 'bg-amber-500 text-white border-amber-600' :
    'bg-slate-900 text-white border-slate-800';

  return (
    <div
      id="toast_banner"
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold tracking-wide transition-all border ${bgClass}`}
    >
      {type === 'success' && <CheckCircle className="w-4 h-4 text-white" />}
      {type === 'warn' && <AlertTriangle className="w-4 h-4 text-white" />}
      {type === 'info' && <Sparkles className="w-4 h-4 text-blue-400 font-bold" />}
      <span>{message}</span>
    </div>
  );
}
