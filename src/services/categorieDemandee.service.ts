import { supabase } from '@/lib/supabase';
import type { StatutAdhesionCategorie } from '@/types/enums';
import type { CategorieDemandeeRow, OeuvreResume } from '@/types/models';
import { UserFacingError } from '@/utils/errors';
import { rangeOf, type ListParams, type Paged } from './helpers';
import { tryCreateNotification } from './notification.service';

// Demandes de catégorie supplémentaire déposées par les membres depuis l'application mobile (table membre_categorie, statut EN_ATTENTE).
// Règle mobile : « seul un agent OMDA active une catégorie » ; le membre peut annuler tant que la demande est EN_ATTENTE.
export interface CategorieDemandeeParams extends ListParams { statut?: StatutAdhesionCategorie; categorieId?: string }

export async function listCategoriesDemandees(p: CategorieDemandeeParams): Promise<Paged<CategorieDemandeeRow>> {
  const { from, to } = rangeOf(p);
  let q = supabase.from('membre_categorie').select(
    `id, statut, date_activation,
     membre:membre(id, numero_adherent, utilisateur_id, candidat:candidat(nom, prenom)),
     categorie:categorie(id, libelle)`,
    { count: 'exact' },
  );
  if (p.statut) q = q.eq('statut', p.statut);
  if (p.categorieId) q = q.eq('categorie_id', p.categorieId);
  q = q.order(p.sortKey ?? 'date_activation', { ascending: p.ascending ?? false }).range(from, to);
  const { data, count, error } = await q;
  if (error) throw error;
  return { rows: (data ?? []) as unknown as CategorieDemandeeRow[], total: count ?? 0 };
}

export async function listOeuvresDuMembreDansCategorie(membreId: string, categorieId: string): Promise<OeuvreResume[]> {
  const { data, error } = await supabase.from('oeuvre')
    .select('id, titre, statut, annee, categorie:categorie(libelle)')
    .eq('membre_id', membreId).eq('categorie_id', categorieId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as OeuvreResume[];
}

export async function decideCategorie(row: CategorieDemandeeRow, accepter: boolean): Promise<{ notified: boolean }> {
  const { data, error } = await supabase.from('membre_categorie')
    .update(accepter ? { statut: 'ACTIVE', date_activation: new Date().toISOString() } : { statut: 'REJETEE' })
    .eq('id', row.id).eq('statut', 'EN_ATTENTE').select('id');
  if (error) throw error;
  if (!data?.length) throw new UserFacingError("Cette demande n'est plus en attente (le membre l'a peut-être annulée).");
  const libelle = row.categorie?.libelle ?? 'la catégorie demandée';
  const notified = await tryCreateNotification({
    utilisateur_id: row.membre?.utilisateur_id ?? null, candidat_id: null,
    type: accepter ? 'DEMANDE_VALIDEE' : 'DEMANDE_REJETEE',
    titre: accepter ? 'Catégorie supplémentaire validée' : 'Catégorie supplémentaire refusée',
    message: accepter ? `Votre demande pour la catégorie « ${libelle} » a été validée.` : `Votre demande pour la catégorie « ${libelle} » a été refusée.`,
  });
  return { notified };
}
