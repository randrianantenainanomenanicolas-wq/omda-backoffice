import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bell, LogOut, Menu } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import Breadcrumb from './Breadcrumb';
import { useAuth } from '@/features/auth/AuthContext';
import { useConfirm } from '@/hooks/useConfirm';
import { countUnread } from '@/services/notification.service';
import { roleLabels } from '@/utils/statuts';
import { toFrenchMessage } from '@/utils/errors';

export default function Header({ onMenu }: { onMenu: () => void }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { confirm, dialog } = useConfirm();
  const { data: unread = 0 } = useQuery({
    queryKey: ['notifications', 'unread', profile?.id],
    queryFn: () => countUnread(profile!.id),
    enabled: !!profile,
    refetchInterval: 60_000,
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (e) {
      toast.error(toFrenchMessage(e, 'Déconnexion impossible. Veuillez réessayer.'));
    }
  };

  return (
    <>
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-omda-borderGray/70 bg-omda-warmGray/90 px-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} className="rounded-lg p-2 text-omda-textGray hover:bg-white lg:hidden" aria-label="Ouvrir le menu"><Menu className="h-5 w-5" /></button>
        <span className="flex items-center gap-2 font-bold text-omda-green sm:hidden"><img src="/omda-logo.png" alt="" className="h-7 w-7" />OMDA</span>
        <div className="hidden sm:block"><Breadcrumb /></div>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/notifications" className="relative rounded-full p-2 text-omda-textGray hover:bg-white" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-omda-errorRed px-1 text-[10px] font-semibold text-white">{unread > 99 ? '99+' : unread}</span>}
        </Link>
        <Link to="/profil" className="flex items-center gap-3 rounded-full py-1 pl-1 pr-3 hover:bg-white">
          <Avatar path={profile?.photo_path} label={profile?.email ?? '?'} size="sm" />
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-medium">{profile?.email}</span>
            <span className="block text-xs text-omda-textGray">{profile ? roleLabels[profile.role] : ''}</span>
          </span>
        </Link>
        <button onClick={() => confirm({ title: 'Se déconnecter', message: 'Voulez-vous vraiment vous déconnecter ?' }, handleSignOut)} className="rounded-full p-2 text-omda-textGray hover:bg-white hover:text-omda-errorRed" aria-label="Se déconnecter"><LogOut className="h-5 w-5" /></button>
      </div>
    </header>
    {/* Hors de l'en-tête : son flou d'arrière-plan décalerait la fenêtre fixe. */}
    {dialog}
    </>
  );
}
