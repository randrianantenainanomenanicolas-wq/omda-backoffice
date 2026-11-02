import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props { page: number; pageSize: number; total: number; onPage: (p: number) => void }

export default function Pagination({ page, pageSize, total, onPage }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const btn = 'rounded-lg border border-omda-borderGray p-1.5 disabled:opacity-40 hover:bg-omda-warmGray';
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-3 text-sm text-omda-textGray sm:flex-row sm:justify-between">
      <span>{from}–{to} sur {total.toLocaleString('fr-FR')}</span>
      <div className="flex items-center gap-2">
        <button className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Page précédente"><ChevronLeft className="h-4 w-4" /></button>
        <span>Page {page} / {pages}</span>
        <button className={btn} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Page suivante"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
