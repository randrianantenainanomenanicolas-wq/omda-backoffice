import { supabase } from '@/lib/supabase';
import type { Candidat, DemandeResume } from '@/types/models';
import { cleanTerm, rangeOf, type ListParams, type Paged } from './helpers';

export const CANDIDAT_SEARCH_COLUMNS = ['nom', 'prenom', 'cin', 'email', 'telephone'] as const;

export async function listCandidats(p: ListParams): Promise<Paged<Candidat>> {
  const { from, to } = rangeOf(p);
  let q = supabase.from('candidat').select('*', { count: 'exact' });
  const term = cleanTerm(p.search ?? '');
  if (term) q = q.or(CANDIDAT_SEARCH_COLUMNS.map((c) => `${c}.ilike.%${term}%`).join(','));
  q = q.order(p.sortKey ?? 'created_at', { ascending: p.ascending ?? false }).range(from, to);
  const { data, count, error } = await q;
  if (error) throw error;
  return { rows: (data ?? []) as Candidat[], total: count ?? 0 };
}

export async function getCandidat(id: string): Promise<Candidat | null> {
  const { data, error } = await supabase.from('candidat').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Candidat | null;
}

export type CandidatInput = Pick<Candidat, 'nom' | 'prenom' | 'cin' | 'date_naissance' | 'telephone' | 'email' | 'adresse'>;

// Le schéma ne définit aucun trigger updated_at : on le renseigne côté client.
export async function updateCandidat(id: string, values: CandidatInput): Promise<void> {
  const { error } = await supabase.from('candidat').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function listDemandesOfCandidat(candidatId: string): Promise<DemandeResume[]> {
  const { data, error } = await supabase
    .from('demande_adhesion')
    .select('id, numero_dossier, statut, date_soumission, categorie:categorie(libelle)')
    .eq('candidat_id', candidatId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DemandeResume[];
}

export async function findMembreIdOfCandidat(candidatId: string): Promise<string | null> {
  const { data, error } = await supabase.from('membre').select('id').eq('candidat_id', candidatId).maybeSingle();
  if (error) throw error;
  return (data as { id: string } | null)?.id ?? null;
}
