import type { ComponentType } from 'react';
import { Navigate, createBrowserRouter, type RouteObject } from 'react-router-dom';
import RouteError from '@/components/common/RouteError';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/features/auth/LoginPage';
import ProtectedRoute from '@/features/auth/ProtectedRoute';
import RoleRoute from '@/features/auth/RoleRoute';
import NotFoundPage from '@/features/NotFoundPage';

// Chaque page est chargée à la demande : le premier affichage reste léger
// (recharts, par exemple, n'est téléchargé qu'avec le tableau de bord).
const page = (load: () => Promise<{ default: ComponentType }>): Pick<RouteObject, 'lazy'> => ({
  lazy: async () => ({ Component: (await load()).default }),
});

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <RouteError /> },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            // Une erreur dans une page s'affiche dans le contenu : le menu et l'en-tête restent utilisables.
            errorElement: <RouteError />,
            children: [
              { path: '/', element: <Navigate to="/dashboard" replace /> },
              { path: '/dashboard', ...page(() => import('@/features/dashboard/DashboardPage')) },
              { path: '/membres', ...page(() => import('@/features/membres/MembresPage')) },
              { path: '/membres/:id', ...page(() => import('@/features/membres/MembreDetailPage')) },
              { path: '/candidats', ...page(() => import('@/features/candidats/CandidatsPage')) },
              { path: '/candidats/:id', ...page(() => import('@/features/candidats/CandidatDetailPage')) },
              { path: '/demandes', ...page(() => import('@/features/demandes/DemandesPage')) },
              { path: '/demandes/:id', ...page(() => import('@/features/demandes/DemandeDetailPage')) },
              { path: '/demandes-categorie', ...page(() => import('@/features/categories-demandees/CategoriesDemandeesPage')) },
              { path: '/oeuvres', ...page(() => import('@/features/oeuvres/OeuvresPage')) },
              { path: '/oeuvres/:id', ...page(() => import('@/features/oeuvres/OeuvreDetailPage')) },
              { path: '/paiements', ...page(() => import('@/features/paiements/PaiementsPage')) },
              { path: '/paiements/:id', ...page(() => import('@/features/paiements/PaiementDetailPage')) },
              { path: '/categories', ...page(() => import('@/features/settings/CategoriesPage')) },
              { path: '/tarifs', ...page(() => import('@/features/settings/TarifsPage')) },
              { path: '/documentation', ...page(() => import('@/features/settings/DocumentationPage')) },
              { path: '/notifications', ...page(() => import('@/features/notifications/NotificationsPage')) },
              { path: '/profil', ...page(() => import('@/features/profil/ProfilPage')) },
              {
                element: <RoleRoute allowedRoles={['ADMINISTRATEUR']} />,
                children: [{ path: '/utilisateurs', ...page(() => import('@/features/utilisateurs/UtilisateursPage')) }],
              },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
