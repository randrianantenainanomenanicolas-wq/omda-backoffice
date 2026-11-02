import type { StatutDemande, TypePiece } from '@/types/enums';

// Règles métier communes avec l'application mobile (cahier des charges §10, API_CANDIDAT §8).
export const DELAI_INDICATIF_HEURES = 72;          // délai affiché au candidat, informatif
export const MIN_OEUVRES_ADHESION = 2;             // au moins 2 œuvres…
export const PIECES_OBLIGATOIRES: TypePiece[] = ['PHOTO', 'CIN', 'ACTE_NAISSANCE', 'CERTIFICAT_RESIDENCE'];
// … chacune avec au moins 1 attestation de diffusion ; autorisation parentale pour les 15–17 ans.

export function ageAu(dateNaissance: string, reference: Date): number {
  const n = new Date(dateNaissance);
  let age = reference.getFullYear() - n.getFullYear();
  const anniversaireAtteint = reference.getMonth() > n.getMonth() || (reference.getMonth() === n.getMonth() && reference.getDate() >= n.getDate());
  if (!anniversaireAtteint) age -= 1;
  return age;
}

/** Dossier en attente de décision depuis plus de 72 h (indicateur interne, le délai reste indicatif pour le candidat). */
export function estHorsDelai(statut: StatutDemande, dateSoumission: string | null, maintenant: Date = new Date()): boolean {
  if (!dateSoumission || (statut !== 'ENVOYEE' && statut !== 'EN_COURS_DE_VERIFICATION')) return false;
  return maintenant.getTime() - new Date(dateSoumission).getTime() > DELAI_INDICATIF_HEURES * 3_600_000;
}

export interface ControleDossier {
  piecesManquantes: TypePiece[];
  autorisationParentaleRequise: boolean;
  nbOeuvres: number;
  oeuvresSansAttestation: string[];
  complet: boolean;
}

export function controleDossier(a: {
  dateNaissance: string | null; dateSoumission: string | null;
  pieces: Array<{ type: TypePiece }>; oeuvres: Array<{ titre: string; nbAttestations: number }>;
}): ControleDossier {
  const ref = a.dateSoumission ? new Date(a.dateSoumission) : new Date();
  const age = a.dateNaissance ? ageAu(a.dateNaissance, ref) : null;
  const autorisationParentaleRequise = age !== null && age >= 15 && age < 18;
  const presentes = new Set(a.pieces.map((p) => p.type));
  const requises = autorisationParentaleRequise ? [...PIECES_OBLIGATOIRES, 'AUTORISATION_PARENTALE' as TypePiece] : PIECES_OBLIGATOIRES;
  const piecesManquantes = requises.filter((t) => !presentes.has(t));
  const oeuvresSansAttestation = a.oeuvres.filter((o) => o.nbAttestations < 1).map((o) => o.titre);
  return {
    piecesManquantes, autorisationParentaleRequise, nbOeuvres: a.oeuvres.length, oeuvresSansAttestation,
    complet: piecesManquantes.length === 0 && a.oeuvres.length >= MIN_OEUVRES_ADHESION && oeuvresSansAttestation.length === 0,
  };
}

/** Éléments manquants, en une phrase chacun (vide si le dossier est complet). */
export function resumeManques(c: ControleDossier): string[] {
  const m: string[] = [];
  if (c.piecesManquantes.length) m.push(`${c.piecesManquantes.length} pièce${c.piecesManquantes.length > 1 ? 's' : ''} obligatoire${c.piecesManquantes.length > 1 ? 's' : ''} manquante${c.piecesManquantes.length > 1 ? 's' : ''}`);
  if (c.nbOeuvres < MIN_OEUVRES_ADHESION) m.push(`${MIN_OEUVRES_ADHESION} œuvres minimum requises (${c.nbOeuvres} déposée${c.nbOeuvres > 1 ? 's' : ''})`);
  if (c.oeuvresSansAttestation.length) m.push(`${c.oeuvresSansAttestation.length} œuvre${c.oeuvresSansAttestation.length > 1 ? 's' : ''} sans attestation de diffusion`);
  return m;
}

/**
 * Qui peut valider un dossier ?
 *  - dossier complet : tout le personnel ;
 *  - dossier incomplet : un agent est bloqué ; un administrateur peut passer outre après un avertissement explicite ;
 *  - contrôle pas encore chargé : personne (on ne valide pas à l'aveugle).
 * Règle d'interface : la base de données ne vérifie pas le contenu du dossier.
 */
export function regleValidation(controle: ControleDossier | null, estAdministrateur: boolean): { bloquee: boolean; avertir: boolean } {
  if (!controle) return { bloquee: true, avertir: false };
  if (controle.complet) return { bloquee: false, avertir: false };
  return estAdministrateur ? { bloquee: false, avertir: true } : { bloquee: true, avertir: false };
}
