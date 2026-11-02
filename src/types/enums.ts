// Valeurs identiques aux ENUM PostgreSQL de SCHEMA_DB.md. Ne jamais les traduire ici.
export const ROLES = ['MEMBRE', 'AGENT', 'ADMINISTRATEUR'] as const;
export type RoleUtilisateur = (typeof ROLES)[number];

export const STATUTS_UTILISATEUR = ['ACTIF', 'DESACTIVE', 'EN_ATTENTE_CHANGEMENT_MDP'] as const;
export type StatutUtilisateur = (typeof STATUTS_UTILISATEUR)[number];

export const STATUTS_DEMANDE = [
  'BROUILLON', 'ENVOYEE', 'EN_COURS_DE_VERIFICATION', 'VALIDEE', 'REJETEE', 'ADHESION_TERMINEE',
] as const;
export type StatutDemande = (typeof STATUTS_DEMANDE)[number];

export const TYPES_PIECE = [
  'PHOTO', 'CIN', 'ACTE_NAISSANCE', 'CERTIFICAT_RESIDENCE', 'AUTORISATION_PARENTALE', 'AUTRE',
] as const;
export type TypePiece = (typeof TYPES_PIECE)[number];

export const STATUTS_OEUVRE = [
  'BROUILLON', 'ENVOYEE', 'EN_COURS_DE_VALIDATION', 'VALIDEE', 'REJETEE', 'DEPOT_FINALISE',
] as const;
export type StatutOeuvre = (typeof STATUTS_OEUVRE)[number];

export const TYPES_PAIEMENT = ['ADHESION', 'DEPOT_OEUVRE', 'COTISATION'] as const;
export type TypePaiement = (typeof TYPES_PAIEMENT)[number];

export const MODES_PAIEMENT = ['MOBILE_MONEY'] as const;
export type ModePaiement = (typeof MODES_PAIEMENT)[number];

export const OPERATEURS_PAIEMENT = ['MVOLA'] as const;
export type OperateurPaiement = (typeof OPERATEURS_PAIEMENT)[number];

export const STATUTS_PAIEMENT = [
  'INITIE', 'EN_ATTENTE_CONFIRMATION',
  'REUSSI', 'ECHEC_SOLDE_INSUFFISANT', 'ECHEC_AUTRE', 'REJETE',
] as const;
export type StatutPaiement = (typeof STATUTS_PAIEMENT)[number];

export const TYPES_OPERATION_TARIF = ['ADHESION', 'DEPOT_OEUVRE'] as const;
export type TypeOperationTarif = (typeof TYPES_OPERATION_TARIF)[number];


export const STATUTS_ADHESION_CATEGORIE = ['ACTIVE', 'EN_ATTENTE', 'INACTIVE', 'REJETEE', 'ANNULEE'] as const;
export type StatutAdhesionCategorie = (typeof STATUTS_ADHESION_CATEGORIE)[number];

export const TYPES_NOTIFICATION = [
  'DEMANDE_ENVOYEE', 'DEMANDE_VALIDEE', 'DEMANDE_REJETEE', 'PAIEMENT_DISPONIBLE', 'PAIEMENT_REUSSI',
  'PAIEMENT_ECHEC', 'OEUVRE_VALIDEE', 'OEUVRE_REJETEE',
  'IDENTIFIANTS_ENVOYES', 'GLOBALE',
] as const;
export type TypeNotification = (typeof TYPES_NOTIFICATION)[number];
