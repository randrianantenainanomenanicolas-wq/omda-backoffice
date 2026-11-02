import {
  LayoutDashboard, Users, UserSearch, FileCheck2, Music2, CreditCard, Bell, Tags, Coins,
  BookOpen, ShieldCheck, Layers, type LucideIcon,
} from 'lucide-react';
import type { RoleUtilisateur } from '@/types/enums';

export interface NavItem { to: string; label: string; icon: LucideIcon; roles?: RoleUtilisateur[] }
export interface NavGroup { title?: string; items: NavItem[] }

const ADMIN: RoleUtilisateur[] = ['ADMINISTRATEUR'];

// `roles` absent = tout le staff. L'affichage du menu n'est qu'un confort : la RLS reste l'autorité.
export const NAV: NavGroup[] = [
  {
    items: [
      { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { to: '/membres', label: 'Membres', icon: Users },
      { to: '/candidats', label: 'Candidats', icon: UserSearch },
      { to: '/demandes', label: "Demandes d'adhésion", icon: FileCheck2 },
      { to: '/demandes-categorie', label: 'Catégories demandées', icon: Layers },
      { to: '/oeuvres', label: 'Œuvres', icon: Music2 },
      { to: '/paiements', label: 'Paiements', icon: CreditCard },
      { to: '/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    title: 'Paramètres',
    items: [
      { to: '/categories', label: 'Catégories', icon: Tags },
      { to: '/tarifs', label: 'Tarifs', icon: Coins },
      { to: '/documentation', label: 'Documentation', icon: BookOpen },
      { to: '/utilisateurs', label: 'Utilisateurs', icon: ShieldCheck, roles: ADMIN },
    ],
  },
];

export const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: 'Tableau de bord', membres: 'Membres', candidats: 'Candidats', demandes: "Demandes d'adhésion",
  oeuvres: 'Œuvres', paiements: 'Paiements', notifications: 'Notifications',
  categories: 'Catégories', tarifs: 'Tarifs', documentation: 'Documentation',
  'demandes-categorie': 'Catégories demandées',
  utilisateurs: 'Utilisateurs', profil: 'Mon profil',
};
