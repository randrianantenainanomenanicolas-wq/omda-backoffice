import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props { label: string; value: string | number; icon: LucideIcon; hint?: string; to?: string }

/** Indicateur clé de la vue d'ensemble : pastille d'icône, grande valeur, précision éventuelle. */
export default function KpiCard({ label, value, icon: Icon, hint, to }: Props) {
  const body = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-omda-green/10 text-omda-green"><Icon className="h-5 w-5" /></span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium text-omda-textGray">{label}</span>
        <span className="block truncate text-xl font-bold tabular-nums sm:text-2xl">{typeof value === 'number' ? value.toLocaleString('fr-FR') : value}</span>
        {hint && <span className="block truncate text-[11px] text-omda-textGray">{hint}</span>}
      </span>
    </>
  );
  const cls = 'flex items-center gap-3 rounded-xl border border-omda-borderGray/80 bg-white p-4 shadow-card';
  return to
    ? <Link to={to} className={`${cls} transition-colors hover:border-omda-green/50`}>{body}</Link>
    : <div className={cls}>{body}</div>;
}
