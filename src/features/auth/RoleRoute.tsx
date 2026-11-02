import { Outlet } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from './AuthContext';
import type { RoleUtilisateur } from '@/types/enums';

export default function RoleRoute({ allowedRoles }: { allowedRoles: RoleUtilisateur[] }) {
  const { profile } = useAuth();
  if (!profile || !allowedRoles.includes(profile.role)) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-xl border border-omda-borderGray bg-white p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-omda-ochre" />
        <h2 className="mt-4 text-lg font-semibold">Accès refusé</h2>
        <p className="mt-2 text-sm text-omda-textGray">Cette section est réservée aux administrateurs.</p>
      </div>
    );
  }
  return <Outlet />;
}
