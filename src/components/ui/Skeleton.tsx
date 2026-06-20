interface SkeletonProps {
  className?: string;
  count?: number;
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded bg-slate-200 dark:bg-slate-700 animate-shimmer ${className}`}
      aria-hidden="true"
    />
  );
}

export default function Skeleton({ className = 'h-4 w-full', count = 1 }: SkeletonProps) {
  return (
    <span className="inline-flex flex-col gap-2" role="presentation">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBlock key={i} className={className} />
      ))}
    </span>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-full rounded-md" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={`h-6 w-full rounded-sm ${i % 2 === 0 ? 'w-11/12' : 'w-10/12'}`} />
      ))}
    </div>
  );
}
