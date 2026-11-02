import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BREADCRUMB_LABELS } from '@/components/layout/navigation';

/** Titre d'onglet par page (« Membres – OMDA Back Office ») : repérage dans les onglets et l'historique. */
export function useDocumentTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const [first, second] = pathname.split('/').filter(Boolean);
    const label = BREADCRUMB_LABELS[first ?? 'dashboard'];
    document.title = label ? `${second ? `${label} : détail` : label} – OMDA Back Office` : 'OMDA Back Office';
  }, [pathname]);
}
