import { supabase } from '@/lib/supabase';
import type { StatutUtilisateur } from '@/types/enums';
import type {
  DemandeResume, MembreDetail, MembreRow, OeuvreResume, PaiementResume,
} from '@/types/models';
import { CANDIDAT_SEARCH_COLUMNS } from './candidat.service';
import { cleanTerm, rangeOf, type ListParams, type Paged } from './helpers';

export interface MembreListParams extends ListParams { statut?: StatutUtilisateur; categorieId?: string }

export async function listMembres(p: MembreListParams): Promise<Paged<MembreRow>> {
  const { from, to } = rangeOf(p);
  // !inner uniquement quand on filtre par catégorie (sinon on garde toutes les catégories du membre).
  const mc = p.categorieId ? 'membre_categorie!inner' : 'membre_categorie';
  let q = supabase
    .from('membre')
    .select(
      `id, numero_adherent, statut, created_at,
       candidat:candidat(nom, prenom, email, telephone),
       ${mc}(statut, categorie:categorie(id, libelle))`,
      { count: 'exact' },
    );

  const term = cleanTerm(p.search ?? '');
  if (term) {
    // La recherche porte sur le n° adhérent et sur l'identité du candidat (résolue en deux temps).
    const { data: ids, error: e1 } = await supabase
      .from('candidat')
      .select('id')
      .or(CANDIDAT_SEARCH_COLUMNS.map((c) => `${c}.ilike.%${term}%`).join(','))
      .limit(200);
    if (e1) throw e1;
    const list = ((ids ?? []) as { id: string }[]).map((r) => r.id);
    const parts = [`numero_adherent.ilike.%${term}%`];
    if (list.length) parts.push(`candidat_id.in.(${list.join(',')})`);
    q = q.or(parts.join(','));
  }
  if (p.statut) q = q.eq('statut', p.statut);
  if (p.categorieId) q = q.eq('membre_categorie.categorie_id', p.categorieId);

  q = q.order(p.sortKey ?? 'created_at', { ascending: p.ascending ?? false }).range(from, to);
  const { data, count, error } = await q;
  if (error) throw error;
  return { rows: (data ?? []) as unknown as MembreRow[], total: count ?? 0 };
}

export async function getMembre(id: string): Promise<MembreDetail | null> {
  const { data, error } = await supabase
    .from('membre')
    .select('*, candidat:candidat(*), membre_categorie(id, statut, date_activation, categorie:categorie(id, code, libelle))')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as MembreDetail | null;
}

export interface MembreDossier {
  demandes: DemandeResume[];
  oeuvres: OeuvreResume[];
  paiements: PaiementResume[];
}

export async function getMembreDossier(id: string): Promise<MembreDossier> {
  const [d, o, p] = await Promise.all([
    supabase.from('demande_adhesion')
      .select('id, numero_dossier, statut, date_soumission, categorie:categorie(libelle)')
      .eq('membre_id', id).order('created_at', { ascending: false }),
    supabase.from('oeuvre')
      .select('id, titre, statut, annee, categorie:categorie(libelle)')
      .eq('membre_id', id).order('created_at', { ascending: false }),
    supabase.from('paiement')
      .select('id, type, montant, devise, mode, operateur, statut, reference_interne, date_initiation')
      .eq('membre_id', id).order('date_initiation', { ascending: false }),
  ]);
  for (const r of [d, o, p]) if (r.error) throw r.error;
  return {
    demandes: (d.data ?? []) as unknown as DemandeResume[],
    oeuvres: (o.data ?? []) as unknown as OeuvreResume[],
    paiements: (p.data ?? []) as PaiementResume[],
  };
}
