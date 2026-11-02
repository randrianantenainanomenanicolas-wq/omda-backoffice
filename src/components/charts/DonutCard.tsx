import type { ReactNode } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import Card from '@/components/common/Card';

export interface DonutSlice { key: string; label: string; value: number; color: string }

interface Props {
  title: string;
  slices: DonutSlice[];
  /** Libellé affiché sous le total au centre de l'anneau (ex. « demandes »). */
  unit: string;
  emptyText: string;
  action?: ReactNode;
}

/** Répartition par statut : anneau + légende chiffrée (la couleur ne porte jamais seule l'information). */
export default function DonutCard({ title, slices, unit, emptyText, action }: Props) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const visible = slices.filter((s) => s.value > 0);

  return (
    <Card title={title} action={action}>
      {total === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-omda-textGray">{emptyText}</p>
      ) : (
        <div className="flex flex-col items-center gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative h-40 w-40 shrink-0" role="img" aria-label={`${title} : ${total} ${unit}`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={visible} dataKey="value" nameKey="label" innerRadius={52} outerRadius={74} paddingAngle={visible.length > 1 ? 2 : 0} stroke="none" startAngle={90} endAngle={-270}>
                  {visible.map((s) => <Cell key={s.key} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #DDD9CE', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums leading-none">{total.toLocaleString('fr-FR')}</span>
              <span className="mt-1 text-[11px] text-omda-textGray">{unit}</span>
            </div>
          </div>
          <ul className="w-full min-w-0 flex-1 space-y-1.5">
            {slices.map((s) => (
              <li key={s.key} className={`flex items-center gap-2 text-sm ${s.value === 0 ? 'opacity-45' : ''}`}>
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                <span className="min-w-0 flex-1 truncate">{s.label}</span>
                <span className="font-semibold tabular-nums">{s.value.toLocaleString('fr-FR')}</span>
                <span className="w-10 text-right text-xs tabular-nums text-omda-textGray">{Math.round((s.value / total) * 100)} %</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
