import type { LucideIcon } from 'lucide-react';

type Tone = 'default' | 'alert';
interface Props { label: string; value: number; icon: LucideIcon; hint?: string; tone?: Tone }

// `alert` met en avant ce qui demande une action (ocre) ; `default` reste sobre (vert).
const TILE: Record<Tone, string> = {
  default: 'bg-omda-green/10 text-omda-green',
  alert: 'bg-omda-ochre/20 text-omda-ochreDark',
};

export default function StatCard({ label, value, icon: Icon, hint, tone = 'default' }: Props) {
  return (
    <div className={`rounded-xl border bg-white p-4 shadow-card ${tone === 'alert' && value > 0 ? 'border-omda-ochre/60' : 'border-omda-borderGray/80'}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-omda-textGray">{label}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TILE[tone]}`}><Icon className="h-[18px] w-[18px]" /></span>
      </div>
      <p className="mt-2 text-2xl font-bold sm:text-3xl tabular-nums">{value.toLocaleString('fr-FR')}</p>
      {hint && <p className="mt-1 text-xs text-omda-textGray">{hint}</p>}
    </div>
  );
}
