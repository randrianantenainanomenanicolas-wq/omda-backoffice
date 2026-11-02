import { supabase } from '@/lib/supabase';
import { UserFacingError } from '@/utils/errors';

/**
 * Suppressions du Back Office (administrateurs). Chaque fonction applique des garde-fous métier AVANT de
 * supprimer, puis la base fait foi (RLS + clés étrangères). Jamais de suppression en cascade côté client.
 */

async function count(table: string, column: string, value: string, extra?: (q: ReturnType<typeof base>) => ReturnType<typeof base>): Promise<number> {
  const q = extra ? extra(base(table, column, value)) : base(table, column, value);
  const { count: n, error } = await q;
  if (error) throw error;
  return n ?? 0;
}
const base = (table: string, column: string, value: string) =>
  supabase.from(table).select('id', { count: 'exact', head: true }).eq(column, value);

/** Supprime une ligne. La RLS ne renvoie pas d'erreur quand elle refuse : on vérifie qu'une ligne a bien disparu. */
async function deleteRow(table: string, id: string): Promise<void> {
  const { data, error } = await supabase.from(table).delete().eq('id', id).select('id');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new UserFacingError("Suppression refusée : vous n'avez pas les droits nécessaires, ou l'enregistrement n'existe plus.");
  }
}

/** Nettoyage des fichiers : un échec ici ne doit pas faire croire que la suppression a échoué. */
async function removeFiles(bucket: 'pieces' | 'oeuvres', paths: Array<string | null | undefined>): Promise<void> {
  const list = paths.filter((p): p is string => !!p);
  if (!list.length) return;
  try { await supabase.storage.from(bucket).remove(list); } catch { /* fichiers orphelins : sans conséquence pour les données */ }
}

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

export async function deletePaiement(id: string, statut: string): Promise<void> {
  if (statut === 'REUSSI') throw new UserFacingError("Un paiement réussi est une pièce comptable : il ne peut pas être supprimé.");
  await deleteRow('paiement', id);
}

export async function deleteOeuvre(id: string): Promise<void> {
  const { data: o, error } = await supabase.from('oeuvre').select('statut, chemin_fichier').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!o) throw new UserFacingError("Cette œuvre n'existe plus.");
  if (o.statut === 'DEPOT_FINALISE') throw new UserFacingError("Le dépôt de cette œuvre est finalisé : elle ne peut plus être supprimée.");
  const paid = await count('paiement', 'oeuvre_id', id, (q) => q.eq('statut', 'REUSSI'));
  if (paid > 0) throw new UserFacingError('Un paiement réussi est lié à cette œuvre : elle ne peut pas être supprimée.');

  const { data: att, error: e2 } = await supabase.from('attestation_diffusion').select('id, chemin_stockage').eq('oeuvre_id', id);
  if (e2) throw e2;
  for (const a of att ?? []) await deleteRow('attestation_diffusion', a.id as string);
  await deleteRow('oeuvre', id);
  await removeFiles('oeuvres', [o.chemin_fichier as string | null, ...(att ?? []).map((a) => a.chemin_stockage as string)]);
}

export async function deleteDemande(id: string): Promise<void> {
  const { data: d, error } = await supabase.from('demande_adhesion').select('statut').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!d) throw new UserFacingError("Cette demande n'existe plus.");
  if (d.statut === 'VALIDEE' || d.statut === 'ADHESION_TERMINEE') {
    throw new UserFacingError("Une demande validée est à l'origine d'une adhésion : elle ne peut pas être supprimée.");
  }
  const oeuvres = await count('oeuvre', 'demande_adhesion_id', id);
  if (oeuvres > 0) throw new UserFacingError(`Ce dossier contient ${plural(oeuvres, 'œuvre', 'œuvres')} : supprimez-les d'abord, ou conservez le dossier.`);
  const paiements = await count('paiement', 'demande_adhesion_id', id);
  if (paiements > 0) throw new UserFacingError(`${plural(paiements, 'paiement est lié', 'paiements sont liés')} à ce dossier : il ne peut pas être supprimé.`);

  const { data: pieces, error: e2 } = await supabase.from('piece').select('id, chemin_stockage').eq('demande_adhesion_id', id);
  if (e2) throw e2;
  for (const p of pieces ?? []) await deleteRow('piece', p.id as string);
  await deleteRow('demande_adhesion', id);
  await removeFiles('pieces', (pieces ?? []).map((p) => p.chemin_stockage as string));
}

export async function deleteCandidat(id: string): Promise<void> {
  const demandes = await count('demande_adhesion', 'candidat_id', id);
  if (demandes > 0) throw new UserFacingError(`Ce candidat a ${plural(demandes, 'demande', 'demandes')} : supprimez-les d'abord.`);
  const membres = await count('membre', 'candidat_id', id);
  if (membres > 0) throw new UserFacingError("Ce candidat est devenu membre : supprimez ou désactivez le membre d'abord.");
  const paiements = await count('paiement', 'candidat_id', id);
  if (paiements > 0) throw new UserFacingError(`${plural(paiements, 'paiement est lié', 'paiements sont liés')} à ce candidat : il ne peut pas être supprimé.`);
  await deleteRow('candidat', id);
}

export async function deleteMembre(id: string): Promise<void> {
  const oeuvres = await count('oeuvre', 'membre_id', id);
  if (oeuvres > 0) throw new UserFacingError(`Ce membre a ${plural(oeuvres, 'œuvre', 'œuvres')} : supprimez-les d'abord. Pour retirer ses accès, désactivez plutôt son compte.`);
  const paiements = await count('paiement', 'membre_id', id);
  if (paiements > 0) throw new UserFacingError(`${plural(paiements, 'paiement est lié', 'paiements sont liés')} à ce membre : il ne peut pas être supprimé. Désactivez plutôt son compte.`);
  const { data: liens, error } = await supabase.from('membre_categorie').select('id').eq('membre_id', id);
  if (error) throw error;
  for (const l of liens ?? []) await deleteRow('membre_categorie', l.id as string);
  await deleteRow('membre', id);
}

export const deleteCategorieDemandee = (id: string) => deleteRow('membre_categorie', id);
export const deleteNotification = (id: string) => deleteRow('notification', id);

/** Tables de référence (catégories, tarifs, documentation…) : l'identifiant peut avoir un autre nom que « id ». */
export async function deleteResource(table: string, idColumn: string, id: string): Promise<void> {
  const { data, error } = await supabase.from(table).delete().eq(idColumn, id).select(idColumn);
  if (error) throw error;
  if (!data || data.length === 0) throw new UserFacingError("Suppression refusée : vous n'avez pas les droits nécessaires.");
}
