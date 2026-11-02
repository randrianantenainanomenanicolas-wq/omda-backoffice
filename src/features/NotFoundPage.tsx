import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-omda-borderGray/80 bg-white p-8 text-center shadow-card">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-omda-green/10 text-omda-green"><Compass className="h-6 w-6" /></span>
      <h1 className="mt-4 text-lg font-bold">Page introuvable</h1>
      <p className="mt-2 text-sm text-omda-textGray">Cette page n'existe pas ou a été déplacée.</p>
      <Link to="/dashboard" className="mt-6 inline-block rounded-lg bg-omda-green px-4 py-2 text-sm font-semibold text-white hover:bg-omda-greenDark">Retour au tableau de bord</Link>
    </div>
  );
}
