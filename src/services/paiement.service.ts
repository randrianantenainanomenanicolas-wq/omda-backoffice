import { supabase } from '@/lib/supabase';
import type { StatutPaiement, TypePaiement } from '@/types/enums';
import type { JournalPaiement, PaiementDetail, PaiementRow } from '@/types/models';
import { cleanTerm, rangeOf, type ListParams, type Paged } from './helpers';

// Les paiements sont initiés par l'application mobile / l'API et confirmés automatiquement par MVola (webhook serveur).
// Le Back Office ne fait donc que CONSULTER : aucun passage manuel à REUSSI.
export interface PaiementListParams extends ListParams { statut?: StatutPaiement; type?: TypePaiement }

export async function listPaiements(p: PaiementListParams): Promise<Paged<PaiementRow>> {
  const { from, to } = rangeOf(p);
  let q = supabase.from('paiement').select(
    `id, type, montant, devise, mode, operateur, statut, reference_interne, reference_externe, date_initiation,
     membre:membre(numero_adherent, candidat:candidat(nom, prenom)), candidat:candidat(nom, prenom)`,
    { count: 'exact' },
  );
  const term = cleanTerm(p.search ?? '');
  if (term) q = q.or(`reference_interne.ilike.%${term}%,reference_externe.ilike.%${term}%,numero_telephone.ilike.%${term}%`);
  if (p.statut) q = q.eq('statut', p.statut);
  if (p.type) q = q.eq('type', p.type);
  q = q.order(p.sortKey ?? 'date_initiation', { ascending: p.ascending ?? false }).range(from, to);
  const { data, count, error } = await q;
  if (error) throw error;
  return { rows: (data ?? []) as unknown as PaiementRow[], total: count ?? 0 };
}

export async function getPaiement(id: string): Promise<PaiementDetail | null> {
  const { data, error } = await supabase.from('paiement').select(
    `*, membre:membre(id, numero_adherent, utilisateur_id, candidat:candidat(nom, prenom)),
     candidat:candidat(id, nom, prenom, utilisateur_id),
     demande:demande_adhesion(id, numero_dossier), oeuvre:oeuvre(id, titre)`,
  ).eq('id', id).maybeSingle();
  if (error) throw error;
  return data as unknown as PaiementDetail | null;
}

export async function listJournal(paiementId: string): Promise<JournalPaiement[]> {
  const { data, error } = await supabase.from('journal_paiement').select('id, evenement, payload, created_at').eq('paiement_id', paiementId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as JournalPaiement[];
}
