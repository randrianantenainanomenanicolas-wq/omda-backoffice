import type {
  RoleUtilisateur, StatutAdhesionCategorie, StatutDemande, StatutOeuvre, StatutPaiement, StatutUtilisateur,
} from '@/types/enums';

// Traduction d'AFFICHAGE uniquement : les valeurs envoyées à Supabase restent les ENUM bruts.
export type Tone = 'gray' | 'blue' | 'amber' | 'green' | 'red' | 'indigo';
interface Meta { label: string; tone: Tone }

export const demandeMeta: Record<StatutDemande, Meta> = {
  BROUILLON: { label: 'Brouillon', tone: 'gray' },
  ENVOYEE: { label: 'Envoyée', tone: 'blue' },
  EN_COURS_DE_VERIFICATION: { label: 'En cours de vérification', tone: 'amber' },
  VALIDEE: { label: 'Validée', tone: 'green' },
  REJETEE: { label: 'Rejetée', tone: 'red' },
  ADHESION_TERMINEE: { label: 'Adhésion terminée', tone: 'indigo' },
};

export const oeuvreMeta: Record<StatutOeuvre, Meta> = {
  BROUILLON: { label: 'Brouillon', tone: 'gray' },
  ENVOYEE: { label: 'Envoyée', tone: 'blue' },
  EN_COURS_DE_VALIDATION: { label: 'En cours de validation', tone: 'amber' },
  VALIDEE: { label: 'Validée', tone: 'green' },
  REJETEE: { label: 'Rejetée', tone: 'red' },
  DEPOT_FINALISE: { label: 'Dépôt finalisé', tone: 'indigo' },
};

export const paiementMeta: Record<StatutPaiement, Meta> = {
  INITIE: { label: 'Initié', tone: 'gray' },
  EN_ATTENTE_CONFIRMATION: { label: 'En attente de confirmation MVola', tone: 'amber' },
  REUSSI: { label: 'Réussi', tone: 'green' },
  ECHEC_SOLDE_INSUFFISANT: { label: 'Échec : solde insuffisant', tone: 'red' },
  ECHEC_AUTRE: { label: 'Échec', tone: 'red' },
  REJETE: { label: 'Rejeté', tone: 'red' },
};

export const utilisateurMeta: Record<StatutUtilisateur, Meta> = {
  ACTIF: { label: 'Actif', tone: 'green' },
  DESACTIVE: { label: 'Désactivé', tone: 'red' },
  EN_ATTENTE_CHANGEMENT_MDP: { label: 'Changement de mot de passe requis', tone: 'amber' },
};

export const roleLabels: Record<RoleUtilisateur, string> = {
  MEMBRE: 'Membre',
  AGENT: 'Agent',
  ADMINISTRATEUR: 'Administrateur',
};

export const typePaiementLabels = { ADHESION: 'Adhésion', DEPOT_OEUVRE: "Dépôt d'œuvre", COTISATION: 'Cotisation' } as const;
export const modePaiementLabels = { MOBILE_MONEY: 'Mobile Money' } as const;
export const operateurLabels = { MVOLA: 'MVola' } as const;

export const typePieceLabels = {
  PHOTO: 'Photo', CIN: "Carte d'identité (CIN)", ACTE_NAISSANCE: 'Acte de naissance',
  CERTIFICAT_RESIDENCE: 'Certificat de résidence', AUTORISATION_PARENTALE: 'Autorisation parentale', AUTRE: 'Autre',
} as const;

export const adhesionCategorieMeta: Record<StatutAdhesionCategorie, Meta> = {
  ACTIVE: { label: 'Active', tone: 'green' },
  EN_ATTENTE: { label: 'En attente de décision', tone: 'amber' },
  INACTIVE: { label: 'Inactive', tone: 'gray' },
  REJETEE: { label: 'Rejetée', tone: 'red' },
  ANNULEE: { label: 'Annulée par le membre', tone: 'gray' },
};
