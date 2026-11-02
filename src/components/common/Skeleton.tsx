export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className}`} aria-hidden />;
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-omda-borderGray/80 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-8 w-20" />
      <Skeleton className="mt-3 h-3 w-40" />
    </div>
  );
}

/** Lignes de liste (notifications, dernières demandes…). */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-omda-warmGray/80" role="status" aria-label="Chargement">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3.5">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-1/2" /><Skeleton className="h-3 w-1/3" /></div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Page de détail en cours de chargement : titre, bloc d'informations et tableau. */
export function PageSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Chargement">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-72 max-w-full" />
      <div className="rounded-xl border border-omda-borderGray/80 bg-white p-5 shadow-card">
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-4 w-40" /></div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-omda-borderGray/80 bg-white shadow-card"><ListSkeleton rows={3} /></div>
    </div>
  );
}
