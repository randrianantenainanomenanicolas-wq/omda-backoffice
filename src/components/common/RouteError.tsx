import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Après une mise en ligne, un onglet resté ouvert peut réclamer une ancienne page qui n'existe plus.
const isStaleBundle = (e: unknown) =>
  e instanceof Error && /dynamically imported module|importing a module script failed|error loading dynamically/i.test(e.message);

export default function RouteError() {
  const error = useRouteError();
  const stale = isStaleBundle(error);
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  const title = stale ? 'Une nouvelle version est disponible' : notFound ? 'Page introuvable' : 'Une erreur est survenue';
  const text = stale
    ? "L'application a été mise à jour. Rechargez la page pour continuer."
    : notFound ? "Cette page n'existe pas ou a été déplacée."
    : "Cette page n'a pas pu s'afficher. Rechargez-la ; si le problème persiste, contactez un administrateur.";

  return (
    <div role="alert" className="mx-auto mt-16 max-w-md rounded-2xl border border-omda-borderGray/80 bg-white p-8 text-center shadow-card">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-omda-ochre/20 text-omda-ochreDark"><AlertTriangle className="h-6 w-6" /></span>
      <h1 className="mt-4 text-lg font-bold">{title}</h1>
      <p className="mt-2 text-sm text-omda-textGray">{text}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 rounded-lg bg-omda-green px-4 py-2 text-sm font-semibold text-white hover:bg-omda-greenDark">
          <RefreshCw className="h-4 w-4" /> Recharger
        </button>
        <Link to="/dashboard" className="rounded-lg border border-omda-borderGray px-4 py-2 text-sm font-medium hover:bg-omda-warmGray">Tableau de bord</Link>
      </div>
    </div>
  );
}
