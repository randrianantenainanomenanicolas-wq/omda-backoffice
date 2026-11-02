import type { Tone } from '@/utils/statuts';

// gray = brouillon / neutre · blue = en cours (info) · amber = en attente · green = succès confirmé
// red = rejet / échec · indigo = état final réussi (adhésion terminée, dépôt finalisé)
const TONES: Record<Tone, string> = {
  gray: 'bg-omda-warmGray text-omda-textGray ring-1 ring-inset ring-omda-borderGray',
  blue: 'bg-omda-infoBlueGray/10 text-omda-infoBlueGray',
  amber: 'bg-omda-ochre/20 text-omda-ochreDark',
  green: 'bg-omda-green/10 text-omda-green',
  red: 'bg-omda-errorRed/10 text-omda-errorRed',
  indigo: 'bg-omda-green text-white',
};

export default function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>{label}</span>;
}
