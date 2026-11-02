import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { NAV } from './navigation';
import { useAuth } from '@/features/auth/AuthContext';

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile } = useAuth();
  const role = profile?.role;

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-omda-black/50 lg:hidden" onClick={onClose} aria-hidden />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-omda-forest text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between px-5">
          <span className="flex items-center gap-3">
            <img src="/omda-logo.png" alt="" className="h-9 w-9 rounded-lg bg-white p-1" />
            <span className="leading-tight">
              <span className="block text-base font-bold tracking-wide">OMDA</span>
              <span className="block text-xs text-white/60">Back Office</span>
            </span>
          </span>
          <button onClick={onClose} className="rounded p-1 text-white/70 hover:bg-white/10 lg:hidden" aria-label="Fermer le menu"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {NAV.map((group, i) => {
            const items = group.items.filter((it) => !it.roles || (role && it.roles.includes(role)));
            if (!items.length) return null;
            return (
              <div key={i}>
                {group.title && <p className="mb-1.5 px-3 text-xs font-medium text-white/50">{group.title}</p>}
                <div className="space-y-0.5">
                  {items.map(({ to, label, icon: Icon }) => (
                    <NavLink key={to} to={to} onClick={onClose}
                      className={({ isActive }) => `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? 'bg-white/12 font-semibold text-white' : 'text-white/70 hover:bg-white/8 hover:text-white'}`}>
                      {({ isActive }) => (
                        <>
                          {isActive && <span className="absolute inset-y-1.5 left-0 w-1 rounded-r bg-omda-ochre" aria-hidden />}
                          <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-omda-ochre' : ''}`} /> {label}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-5 py-3 text-xs text-white/50">Office Malagasy des Droits d'Auteur</div>
      </aside>
    </>
  );
}
