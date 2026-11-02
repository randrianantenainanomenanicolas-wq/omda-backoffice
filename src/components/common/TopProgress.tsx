import { useEffect, useState } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useNavigation } from 'react-router-dom';

/** Fine barre ocre en haut de l'écran pendant les requêtes. N'apparaît qu'après 200 ms : aucun clignotement sur les réponses rapides. */
export default function TopProgress() {
  const navigating = useNavigation().state !== 'idle';
  const busy = useIsFetching() + useIsMutating() > 0 || navigating;
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!busy) {
      setShow(false);
      return undefined;
    }
    const t = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(t);
  }, [busy]);

  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] overflow-hidden bg-omda-green/15" role="progressbar" aria-label="Chargement en cours">
      <div className="h-full w-1/4 animate-progress rounded-full bg-omda-ochre" />
    </div>
  );
}
