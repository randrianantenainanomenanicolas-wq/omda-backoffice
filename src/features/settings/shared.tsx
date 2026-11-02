import StatusBadge from '@/components/common/StatusBadge';

export const ActifBadge = ({ actif, on = 'Actif', off = 'Inactif' }: { actif: unknown; on?: string; off?: string }) =>
  actif ? <StatusBadge label={on} tone="green" /> : <StatusBadge label={off} tone="gray" />;

export const text = (v: unknown): string => (v === null || v === undefined || v === '' ? '—' : String(v));
