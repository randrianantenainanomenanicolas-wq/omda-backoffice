import { supabase } from '@/lib/supabase';
import {
  STATUTS_DEMANDE, STATUTS_OEUVRE, STATUTS_PAIEMENT,
  type StatutDemande, type StatutOeuvre, type StatutPaiement,
} from '@/types/enums';
import { DELAI_INDICATIF_HEURES } from '@/utils/dossier';

/** Nombre de mois affichés dans le graphique d'activité (mois en cours inclus). */
export const NB_MOIS_ACTIVITE = 6;

async function countRows(table: string, column?: string, values?: readonly string[]): Promise<number> {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  if (column && values) query = query.in(column, [...values]);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function countHorsDelai(): Promise<number> {
  const limite = new Date(Date.now() - DELAI_INDICATIF_HEURES * 3_600_000).toISOString();
  const { count, error } = await supabase.from('demande_adhesion').select('*', { count: 'exact', head: true })
    .in('statut', ['ENVOYEE', 'EN_COURS_DE_VERIFICATION']).lt('date_soumission', limite);
  if (error) throw error;
  return count ?? 0;
}

async function countBetween(table: string, column: string, from: Date, to: Date): Promise<number> {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    .gte(column, from.toISOString()).lt(column, to.toISOString());
  if (error) throw error;
  return count ?? 0;
}

export interface ActiviteMois {
  /** Premier jour du mois (ISO) : le libellé est formaté côté affichage. */
  debut: string;
  demandes: number;
  oeuvres: number;
}

/** Demandes et œuvres soumises, mois par mois (comptages exacts côté base). */
async function getActivite(): Promise<ActiviteMois[]> {
  const now = new Date();
  const mois = Array.from({ length: NB_MOIS_ACTIVITE }, (_, i) => {
    const debut = new Date(now.getFullYear(), now.getMonth() - (NB_MOIS_ACTIVITE - 1 - i), 1);
    const fin = new Date(debut.getFullYear(), debut.getMonth() + 1, 1);
    return { debut, fin };
  });
  return Promise.all(mois.map(async ({ debut, fin }) => {
    const [demandes, oeuvres] = await Promise.all([
      countBetween('demande_adhesion', 'date_soumission', debut, fin),
      countBetween('oeuvre', 'date_soumission', debut, fin),
    ]);
    return { debut: debut.toISOString(), demandes, oeuvres };
  }));
}

export interface Encaissements {
  /** Somme des paiements au statut REUSSI (devise MGA) sur la période affichée. */
  periode: number;
  moisEnCours: number;
}

/** Montants encaissés (paiements REUSSI). Limité à 1000 lignes par la configuration PostgREST par défaut. */
async function getEncaissements(): Promise<Encaissements> {
  const now = new Date();
  const debut = new Date(now.getFullYear(), now.getMonth() - (NB_MOIS_ACTIVITE - 1), 1);
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
  const { data, error } = await supabase.from('paiement').select('montant, devise, date_initiation')
    .eq('statut', 'REUSSI').gte('date_initiation', debut.toISOString());
  if (error) throw error;
  let periode = 0;
  let moisEnCours = 0;
  for (const p of data ?? []) {
    if (p.devise !== 'MGA') continue;
    const montant = Number(p.montant) || 0;
    periode += montant;
    if (new Date(p.date_initiation) >= debutMois) moisEnCours += montant;
  }
  return { periode, moisEnCours };
}

export interface DashboardStats {
  membres: number;
  candidats: number;
  demandes: Record<StatutDemande, number>;
  oeuvres: { total: number; enAttente: number; parStatut: Record<StatutOeuvre, number> };
  paiements: { reussis: number; enAttente: number; parStatut: Record<StatutPaiement, number> };
  horsDelai: number;
  categoriesEnAttente: number;
  activite: ActiviteMois[];
  encaissements: Encaissements;
}

function toRecord<T extends string>(keys: readonly T[], values: number[]): Record<T, number> {
  return Object.fromEntries(keys.map((k, i) => [k, values[i]])) as Record<T, number>;
}

// Interprétation de « en attente » (le schéma ne la définit pas, à valider) :
//  - œuvres : ENVOYEE + EN_COURS_DE_VALIDATION
//  - paiements : INITIE + EN_ATTENTE_CONFIRMATION (confirmation MVola côté serveur)
//  - hors délai : demande ENVOYEE / EN_COURS_DE_VERIFICATION soumise depuis plus de 72 h
export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    membres, candidats, horsDelai, categoriesEnAttente, activite, encaissements,
    demandesParStatut, oeuvresParStatut, paiementsParStatut,
  ] = await Promise.all([
    countRows('membre'),
    countRows('candidat'),
    countHorsDelai(),
    countRows('membre_categorie', 'statut', ['EN_ATTENTE']),
    getActivite(),
    getEncaissements(),
    Promise.all(STATUTS_DEMANDE.map((s) => countRows('demande_adhesion', 'statut', [s]))),
    Promise.all(STATUTS_OEUVRE.map((s) => countRows('oeuvre', 'statut', [s]))),
    Promise.all(STATUTS_PAIEMENT.map((s) => countRows('paiement', 'statut', [s]))),
  ]);

  const demandes = toRecord(STATUTS_DEMANDE, demandesParStatut);
  const oeuvresStatut = toRecord(STATUTS_OEUVRE, oeuvresParStatut);
  const paiementsStatut = toRecord(STATUTS_PAIEMENT, paiementsParStatut);

  return {
    membres,
    candidats,
    demandes,
    oeuvres: {
      total: oeuvresParStatut.reduce((a, b) => a + b, 0),
      enAttente: oeuvresStatut.ENVOYEE + oeuvresStatut.EN_COURS_DE_VALIDATION,
      parStatut: oeuvresStatut,
    },
    paiements: {
      reussis: paiementsStatut.REUSSI,
      enAttente: paiementsStatut.INITIE + paiementsStatut.EN_ATTENTE_CONFIRMATION,
      parStatut: paiementsStatut,
    },
    horsDelai,
    categoriesEnAttente,
    activite,
    encaissements,
  };
}
