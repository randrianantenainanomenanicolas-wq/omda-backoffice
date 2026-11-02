export const formatDate = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleDateString('fr-FR') : '—';

export const formatDateTime = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

export const formatMontant = (montant: number, devise = 'MGA'): string =>
  `${montant.toLocaleString('fr-FR')} ${devise}`;

export const formatTaille = (octets: number): string =>
  octets >= 1_048_576 ? `${(octets / 1_048_576).toFixed(1)} Mo` : `${Math.max(1, Math.round(octets / 1024))} Ko`;
