import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { BREADCRUMB_LABELS } from './navigation';

export default function Breadcrumb() {
  const segments = useLocation().pathname.split('/').filter(Boolean);
  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center gap-1 text-sm text-omda-textGray">
      <Link to="/dashboard" className="hover:text-omda-black">Accueil</Link>
      {segments.map((seg, i) => {
        const to = '/' + segments.slice(0, i + 1).join('/');
        const label = BREADCRUMB_LABELS[seg] ?? 'Détail';
        const last = i === segments.length - 1;
        return (
          <span key={to} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
            {last ? <span className="font-medium text-omda-black">{label}</span> : <Link to={to} className="hover:text-omda-black">{label}</Link>}
          </span>
        );
      })}
    </nav>
  );
}
