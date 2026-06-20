import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
      <div className="mb-3 text-slate-300">
        {icon || <Inbox className="w-10 h-10" />}
      </div>
      <p className="text-xs font-semibold text-slate-500 mb-1">{title}</p>
      {description && <p className="text-[10px] text-slate-400 mb-3 text-center max-w-xs">{description}</p>}
      {action}
    </div>
  );
}
