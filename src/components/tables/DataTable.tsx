import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, Inbox } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  getRowId: (row: T) => string;
  loading?: boolean;
  error?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  sort?: { key: string; ascending: boolean };
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  onRetry?: () => void;
}

export default function DataTable<T>({
  columns, rows, getRowId, loading, error, errorMessage = 'Une erreur est survenue lors du chargement.',
  emptyMessage = 'Aucun résultat.', sort, onSort, onRowClick, onRetry,
}: Props<T>) {
  if (error) {
    return (
      <div className="p-6 text-center text-sm text-omda-errorRed">
        {errorMessage} {onRetry && <button onClick={onRetry} className="font-medium underline">Réessayer</button>}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-omda-borderGray/70 bg-omda-warmGray/60 text-xs text-omda-textGray">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`px-3 py-2.5 font-semibold ${c.className ?? ''}`}>
                {c.sortable && onSort ? (
                  <button onClick={() => onSort(c.key)} className="inline-flex items-center gap-1 hover:text-omda-black">
                    {c.header}
                    {sort?.key === c.key && (sort.ascending ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </button>
                ) : c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-omda-warmGray/80">
          {loading && Array.from({ length: 5 }).map((_, i) => (
            <tr key={`sk-${i}`} aria-hidden>
              {columns.map((c) => <td key={c.key} className="px-3 py-3"><Skeleton className="h-4 w-full max-w-[11rem]" /></td>)}
            </tr>
          ))}
          {!loading && rows?.length === 0 && (
            <tr><td colSpan={columns.length} className="py-14 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-omda-warmGray text-omda-textGray"><Inbox className="h-5 w-5" /></span>
              <p className="mt-3 text-sm text-omda-textGray">{emptyMessage}</p>
            </td></tr>
          )}
          {!loading && rows?.map((row) => (
            <tr key={getRowId(row)} onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'cursor-pointer transition-colors hover:bg-omda-green/5' : ''}>
              {columns.map((c) => <td key={c.key} className={`px-3 py-2.5 ${c.className ?? ''}`}>{c.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
