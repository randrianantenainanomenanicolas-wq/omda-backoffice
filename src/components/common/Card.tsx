import type { ReactNode } from 'react';

export default function Card({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-omda-borderGray/80 bg-white shadow-card">
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-omda-warmGray px-4 py-3">
          <h2 className="font-semibold">{title}</h2>{action}
        </div>
      )}
      {children}
    </section>
  );
}

export function InfoGrid({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid gap-x-8 gap-y-4 p-4 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k}><dt className="text-xs font-medium text-omda-textGray">{k}</dt><dd className="mt-1 text-sm">{v ?? '—'}</dd></div>
      ))}
    </dl>
  );
}
