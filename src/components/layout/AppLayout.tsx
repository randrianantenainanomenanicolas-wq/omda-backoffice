import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import TopProgress from '@/components/common/TopProgress';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  useDocumentTitle();

  // Mobile : le menu ouvert bloque le défilement de la page et se ferme avec Échap.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div className="flex min-h-screen">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg">Aller au contenu</a>
      <TopProgress />
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenu={() => setMenuOpen(true)} />
        <main id="contenu" tabIndex={-1} className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-4 outline-none sm:py-5 lg:px-6"><Outlet /></main>
      </div>
    </div>
  );
}
