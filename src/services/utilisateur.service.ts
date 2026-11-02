import { supabase } from '@/lib/supabase';
import type { RoleUtilisateur, StatutUtilisateur } from '@/types/enums';
import type { Utilisateur } from '@/types/models';
import { cleanTerm, rangeOf, type ListParams, type Paged } from './helpers';

export interface UtilisateurListParams extends ListParams { role?: RoleUtilisateur; statut?: StatutUtilisateur }

export async function listUtilisateurs(p: UtilisateurListParams): Promise<Paged<Utilisateur>> {
  const { from, to } = rangeOf(p);
  let q = supabase.from('utilisateur').select('*', { count: 'exact' });
  const term = cleanTerm(p.search ?? '');
  if (term) q = q.or(`email.ilike.%${term}%,telephone.ilike.%${term}%`);
  if (p.role) q = q.eq('role', p.role);
  if (p.statut) q = q.eq('statut', p.statut);
  q = q.order(p.sortKey ?? 'created_at', { ascending: p.ascending ?? false }).range(from, to);
  const { data, count, error } = await q;
  if (error) throw error;
  return { rows: (data ?? []) as Utilisateur[], total: count ?? 0 };
}

export interface UtilisateurInput { telephone: string | null; role: RoleUtilisateur; statut: StatutUtilisateur }

// Ni création de compte ni mot de passe ici : cela relève de Supabase Auth (voir points ouverts).
export async function updateUtilisateur(id: string, v: UtilisateurInput): Promise<void> {
  const { error } = await supabase.from('utilisateur').update({ ...v, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}
