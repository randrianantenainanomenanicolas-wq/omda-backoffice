import type { RoleUtilisateur, StatutAdhesionCategorie, StatutUtilisateur } from './enums';

// Table public.utilisateur (mot_de_passe_hash supprimée par le schéma : les mots de passe sont dans Supabase Auth).
export interface Utilisateur {
  id: string;
  email: string;
  telephone: string | null;
  role: RoleUtilisateur;
  statut: StatutUtilisateur;
  doit_changer_mot_de_passe: boolean;
  derniere_connexion_at: string | null;
  created_at: string;
  updated_at: string;
  /** Chemin de la photo dans le bucket « avatars » (colonne ajoutée par docs/sql/04_photo_profil.sql). */
  photo_path?: string | null;
}
// Les autres modèles seront ajoutés module par module (ou remplacés par src/types/supabase.ts via `npm run gen:types`).

import type {
  ModePaiement, OperateurPaiement, StatutDemande, StatutOeuvre, StatutPaiement, TypePaiement,
} from './enums';

export interface Candidat {
  id: string;
  nom: string;
  prenom: string;
  cin: string;
  date_naissance: string;
  telephone: string;
  email: string;
  adresse: string;
  utilisateur_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategorieRef { id: string; libelle: string }

export interface MembreCategorie {
  id: string;
  statut: StatutAdhesionCategorie;
  date_activation: string;
  categorie: (CategorieRef & { code: string }) | null;
}

export interface MembreRow {
  id: string;
  numero_adherent: string;
  statut: StatutUtilisateur;
  created_at: string;
  candidat: Pick<Candidat, 'nom' | 'prenom' | 'email' | 'telephone'> | null;
  membre_categorie: Array<{ statut: string; categorie: CategorieRef | null }>;
}

export interface MembreDetail {
  id: string;
  numero_adherent: string;
  statut: StatutUtilisateur;
  created_at: string;
  utilisateur_id: string;
  candidat: Candidat | null;
  membre_categorie: MembreCategorie[];
}

export interface DemandeResume {
  id: string;
  numero_dossier: string;
  statut: StatutDemande;
  date_soumission: string | null;
  categorie: { libelle: string } | null;
}
export interface OeuvreResume {
  id: string; titre: string; statut: StatutOeuvre; annee: number | null; categorie: { libelle: string } | null;
}
export interface PaiementResume {
  id: string; type: TypePaiement; montant: number; devise: string; mode: ModePaiement;
  operateur: OperateurPaiement | null; statut: StatutPaiement; reference_interne: string; date_initiation: string;
}

import type { TypePiece } from './enums';

export interface DemandeRow {
  id: string;
  numero_dossier: string;
  statut: StatutDemande;
  date_soumission: string | null;
  created_at: string;
  candidat: Pick<Candidat, 'nom' | 'prenom' | 'cin'> | null;
  categorie: CategorieRef | null;
}

export interface DemandeDetail {
  id: string;
  numero_dossier: string;
  candidat_id: string;
  membre_id: string | null;
  categorie_id: string;
  statut: StatutDemande;
  motif_rejet: string | null;
  date_soumission: string | null;
  date_decision: string | null;
  agent_id: string | null;
  created_at: string;
  candidat: Candidat | null;
  categorie: (CategorieRef & { code: string }) | null;
}

export interface Piece {
  id: string;
  demande_adhesion_id: string;
  type: TypePiece;
  chemin_stockage: string;
  mime_type: string;
  taille_octets: number;
  created_at: string;
}

type Identite = { nom: string; prenom: string };

export interface OeuvreRow {
  id: string;
  titre: string;
  annee: number | null;
  statut: StatutOeuvre;
  date_soumission: string | null;
  created_at: string;
  categorie: CategorieRef | null;
  membre: { numero_adherent: string; candidat: Identite | null } | null;
  demande: { numero_dossier: string; candidat: Identite | null } | null;
}

export interface OeuvreDetail {
  id: string;
  titre: string;
  description: string | null;
  annee: number | null;
  statut: StatutOeuvre;
  motif_rejet: string | null;
  chemin_fichier: string | null;
  mime_type: string | null;
  taille_octets: number | null;
  date_soumission: string | null;
  date_decision: string | null;
  membre_id: string | null;
  demande_adhesion_id: string | null;
  categorie: CategorieRef | null;
  membre: { id: string; numero_adherent: string; utilisateur_id: string; candidat_id: string; candidat: Identite | null } | null;
  demande: { id: string; numero_dossier: string; candidat_id: string; candidat: Identite | null } | null;
}

export interface Attestation {
  id: string;
  oeuvre_id: string;
  chemin_stockage: string;
  mime_type: string;
  taille_octets: number;
  created_at: string;
}

// ---------- Phase 5 ----------
export interface PaiementRow extends PaiementResume {
  reference_externe: string | null;
  membre: { numero_adherent: string; candidat: Identite | null } | null;
  candidat: Identite | null;
}

export interface PaiementDetail extends PaiementRow {
  numero_telephone: string | null;
  motif_echec: string | null;
  date_confirmation: string | null;
  demande_adhesion_id: string | null;
  oeuvre_id: string | null;
  membre: { id: string; numero_adherent: string; utilisateur_id: string; candidat: Identite | null } | null;
  candidat: (Identite & { id: string; utilisateur_id: string | null }) | null;
  demande: { id: string; numero_dossier: string } | null;
  oeuvre: { id: string; titre: string } | null;
}

export interface JournalPaiement { id: string; evenement: string; payload: unknown; created_at: string }

// ---------- Phase 7 ----------
export interface NotificationRow {
  id: string;
  utilisateur_id: string | null;
  type: import('./enums').TypeNotification;
  titre: string;
  message: string;
  lue: boolean;
  globale: boolean;
  date_envoi: string;
}

export interface OeuvreDossier { id: string; titre: string; statut: StatutOeuvre; attestations: Array<{ id: string }> }

export interface CategorieDemandeeRow {
  id: string;
  statut: StatutAdhesionCategorie;
  date_activation: string;
  membre: { id: string; numero_adherent: string; utilisateur_id: string; candidat: Identite | null } | null;
  categorie: CategorieRef | null;
}
