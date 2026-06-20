import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Sparkles, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'warn' | 'info';
}

export default function Toast({ message, type }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  const bgClass =
    type === 'success' ? 'bg-emerald-600 text-white' :
    type === 'warn' ? 'bg-amber-500 text-white' :
    'bg-slate-800 text-white';

  const iconMap = {
    success: CheckCircle,
    warn: AlertTriangle,
    info: Sparkles,
  };
  const Icon = iconMap[type];

  return (
    <div
      id="toast_banner"
      role="alert"
      aria-live="polite"
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold tracking-wide border border-white/10 backdrop-blur-sm transition-all duration-300 ${bgClass} ${
        visible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
      }`}
      style={{ willChange: 'transform, opacity' }}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        onClick={() => setVisible(false)}
        className="shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors"
        aria-label="Tutup"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
