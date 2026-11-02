import { supabase } from '@/lib/supabase';
import type { StatutDemande } from '@/types/enums';
import type { DemandeDetail, DemandeRow, OeuvreDossier, PaiementResume, Piece } from '@/types/models';
import { UserFacingError } from '@/utils/errors';
import { CANDIDAT_SEARCH_COLUMNS } from './candidat.service';
import { cleanTerm, rangeOf, type ListParams, type Paged } from './helpers';
import { tryCreateNotification } from './notification.service';

export interface DemandeListParams extends ListParams { statut?: StatutDemande; categorieId?: string }

export async function listDemandes(p: DemandeListParams): Promise<Paged<DemandeRow>> {
  const { from, to } = rangeOf(p);
  let q = supabase
    .from('demande_adhesion')
    .select('id, numero_dossier, statut, date_soumission, created_at, candidat:candidat(nom, prenom, cin), categorie:categorie(id, libelle)', { count: 'exact' });

  const term = cleanTerm(p.search ?? '');
  if (term) {
    const { data: ids, error: e1 } = await supabase
      .from('candidat').select('id')
      .or(CANDIDAT_SEARCH_COLUMNS.map((c) => `${c}.ilike.%${term}%`).join(',')).limit(200);
    if (e1) throw e1;
    const list = ((ids ?? []) as { id: string }[]).map((r) => r.id);
    const parts = [`numero_dossier.ilike.%${term}%`];
    if (list.length) parts.push(`candidat_id.in.(${list.join(',')})`);
    q = q.or(parts.join(','));
  }
  if (p.statut) q = q.eq('statut', p.statut);
  if (p.categorieId) q = q.eq('categorie_id', p.categorieId);
  q = q.order(p.sortKey ?? 'created_at', { ascending: p.ascending ?? false }).range(from, to);

  const { data, count, error } = await q;
  if (error) throw error;
  return { rows: (data ?? []) as unknown as DemandeRow[], total: count ?? 0 };
}

export async function getDemande(id: string): Promise<DemandeDetail | null> {
  const { data, error } = await supabase
    .from('demande_adhesion')
    .select('*, candidat:candidat(*), categorie:categorie(id, code, libelle)')
    .eq('id', id).maybeSingle();
  if (error) throw error;
  return data as unknown as DemandeDetail | null;
}

export async function listPieces(demandeId: string): Promise<Piece[]> {
  const { data, error } = await supabase.from('piece').select('*').eq('demande_adhesion_id', demandeId).order('created_at');
  if (error) throw error;
  return (data ?? []) as Piece[];
}

/** Bucket privé : jamais d'URL publique, uniquement une URL signée à courte durée (60 s). */
export async function getPieceSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('pieces').createSignedUrl(path, 60);
  if (error || !data) throw error ?? new UserFacingError("Impossible d'accéder à ce fichier.");
  return data.signedUrl;
}

export async function listPaiementsOfDemande(demandeId: string): Promise<PaiementResume[]> {
  const { data, error } = await supabase
    .from('paiement')
    .select('id, type, montant, devise, mode, operateur, statut, reference_interne, date_initiation')
    .eq('demande_adhesion_id', demandeId).order('date_initiation', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PaiementResume[];
}

const now = () => new Date().toISOString();

export async function prendreEnCharge(id: string, agentId: string): Promise<void> {
  const { data, error } = await supabase.from('demande_adhesion')
    .update({ statut: 'EN_COURS_DE_VERIFICATION', agent_id: agentId, updated_at: now() })
    .eq('id', id).eq('statut', 'ENVOYEE').select('id');
  if (error) throw error;
  if (!data?.length) throw new UserFacingError("Cette demande n'est plus à prendre en charge : un autre agent l'a peut-être déjà fait.");
}

export async function rejeterDemande(d: DemandeDetail, agentId: string, motif: string): Promise<{ notified: boolean }> {
  const motifNet = motif.trim();
  if (!motifNet) throw new UserFacingError('Le motif de rejet est obligatoire.');
  const { data, error } = await supabase.from('demande_adhesion')
    .update({ statut: 'REJETEE', motif_rejet: motifNet, agent_id: agentId, date_decision: now(), updated_at: now() })
    .eq('id', d.id).in('statut', ['ENVOYEE', 'EN_COURS_DE_VERIFICATION']).select('id');
  if (error) throw error;
  if (!data?.length) throw new UserFacingError("Cette demande n'est plus en attente de décision.");
  const notified = await tryCreateNotification({
    utilisateur_id: d.candidat?.utilisateur_id ?? null, candidat_id: d.candidat_id, type: 'DEMANDE_REJETEE',
    titre: "Demande d'adhésion rejetée", message: `Votre demande ${d.numero_dossier} a été rejetée. Motif : ${motifNet}`,
  });
  return { notified };
}

/**
 * Validation du dossier : la demande passe à VALIDEE, c'est tout.
 * Règle métier mobile « Validation ≠ membre » : le candidat paie ensuite les frais d'adhésion (MVola, public, numéro de dossier + code de suivi) ;
 * le membre, son numéro d'adhérent et ses identifiants sont créés par le SERVEUR après paiement confirmé (statut ADHESION_TERMINEE).
 */
export async function validerDemande(a: { demande: DemandeDetail; agentId: string }): Promise<{ notified: boolean }> {
  const { demande, agentId } = a;
  const { data, error } = await supabase.from('demande_adhesion')
    .update({ statut: 'VALIDEE', agent_id: agentId, date_decision: now(), motif_rejet: null, updated_at: now() })
    .eq('id', demande.id).in('statut', ['ENVOYEE', 'EN_COURS_DE_VERIFICATION']).select('id');
  if (error) throw error;
  if (!data?.length) throw new UserFacingError("Cette demande n'est plus en attente de décision.");
  const notified = await tryCreateNotification({
    utilisateur_id: demande.candidat?.utilisateur_id ?? null, candidat_id: demande.candidat_id, type: 'DEMANDE_VALIDEE',
    titre: "Demande d'adhésion validée", message: `Votre demande ${demande.numero_dossier} a été validée. Vous pouvez désormais régler les frais d'adhésion.`,
  });
  return { notified };
}

export async function listOeuvresOfDemande(demandeId: string): Promise<OeuvreDossier[]> {
  const { data, error } = await supabase.from('oeuvre')
    .select('id, titre, statut, attestations:attestation_diffusion(id)')
    .eq('demande_adhesion_id', demandeId).order('created_at');
  if (error) throw error;
  return (data ?? []) as unknown as OeuvreDossier[];
}
