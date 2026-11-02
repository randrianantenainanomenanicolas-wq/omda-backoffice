import { useEffect, useRef, useState } from 'react';
import { LifeBuoy, X } from 'lucide-react';

const TOPICS = [
  { q: 'Pas encore de compte ?', a: "Un administrateur de l'OMDA crée votre compte et vous remet un mot de passe temporaire." },
  { q: 'Mot de passe oublié ?', a: 'Demandez à un administrateur de le réinitialiser.' },
  { q: 'Première connexion ?', a: "Entrez le mot de passe temporaire reçu : vous choisirez ensuite le vôtre." },
];

/** Bouton « Aide » flottant, en bas à droite, comme sur les sites professionnels. */
export default function HelpWidget() {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div ref={box} className="fixed bottom-4 right-4 z-20 sm:bottom-6 sm:right-6">
      {open && (
        <div id="aide-connexion" role="region" aria-label="Aide à la connexion"
          className="absolute bottom-14 right-0 w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-white p-4 text-sm shadow-2xl ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Besoin d'aide ?</p>
            <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-omda-textGray hover:bg-omda-warmGray" aria-label="Fermer l'aide"><X className="h-4 w-4" /></button>
          </div>
          <dl className="mt-3 space-y-3">
            {TOPICS.map((t) => (
              <div key={t.q}>
                <dt className="font-medium">{t.q}</dt>
                <dd className="mt-0.5 text-xs text-omda-textGray">{t.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="aide-connexion"
        className="flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-omda-greenDark shadow-lg ring-1 ring-black/5 transition-transform hover:-translate-y-0.5">
        <LifeBuoy className="h-[18px] w-[18px] text-omda-green" aria-hidden /> <span className="hidden sm:inline">Aide</span>
        <span className="sr-only sm:hidden">Aide</span>
      </button>
    </div>
  );
}
