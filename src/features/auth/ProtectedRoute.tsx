import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { FullPageSpinner } from '@/components/common/Spinner';

/** Exige une session valide ET un profil staff actif (AGENT / ADMINISTRATEUR). L'autorité reste la RLS. */
export default function ProtectedRoute() {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  if (!session || !profile || profile.role === 'MEMBRE' || profile.statut === 'DESACTIVE') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  // Changement de mot de passe obligatoire : seule la page profil reste accessible.
  if (profile.statut === 'EN_ATTENTE_CHANGEMENT_MDP' && location.pathname !== '/profil') {
    return <Navigate to="/profil" replace />;
  }
  return <Outlet />;
}
