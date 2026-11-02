import type { StatutDemande, StatutOeuvre, StatutPaiement } from '@/types/enums';

// Couleurs des graphiques : uniquement la palette OMDA (tailwind.config.js), même sens que les badges.
const GRIS = '#B9B5A9';
const BLEU = '#2E4A66';
const OCRE = '#C79A3B';
const VERT = '#2E7A46';
const ROUGE = '#B3261E';
const FORET = '#173D27';

export const demandeColors: Record<StatutDemande, string> = {
  BROUILLON: GRIS, ENVOYEE: BLEU, EN_COURS_DE_VERIFICATION: OCRE, VALIDEE: VERT, REJETEE: ROUGE, ADHESION_TERMINEE: FORET,
};
export const oeuvreColors: Record<StatutOeuvre, string> = {
  BROUILLON: GRIS, ENVOYEE: BLEU, EN_COURS_DE_VALIDATION: OCRE, VALIDEE: VERT, REJETEE: ROUGE, DEPOT_FINALISE: FORET,
};
// Trois statuts d'échec : trois rouges distincts pour rester lisibles dans l'anneau.
export const paiementColors: Record<StatutPaiement, string> = {
  INITIE: GRIS, EN_ATTENTE_CONFIRMATION: OCRE, REUSSI: VERT,
  ECHEC_SOLDE_INSUFFISANT: ROUGE, ECHEC_AUTRE: '#D4635C', REJETE: '#7A1812',
};
export const SERIE_DEMANDES = VERT;
export const SERIE_OEUVRES = OCRE;
