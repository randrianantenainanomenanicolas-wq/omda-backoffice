import { Loader2 } from 'lucide-react';

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-omda-green ${className}`} aria-label="Chargement" />;
}

/** Écran de démarrage : logo OMDA entouré d'un anneau de progression. */
export function FullPageSpinner() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-screen flex-col items-center justify-center gap-5 bg-omda-warmGray">
      <div className="relative h-20 w-20">
        <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-omda-green/15 border-t-omda-green" />
        <img src="/omda-logo.png" alt="" className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 object-contain" />
      </div>
      <p className="text-sm font-medium text-omda-textGray">Chargement…</p>
    </div>
  );
}
