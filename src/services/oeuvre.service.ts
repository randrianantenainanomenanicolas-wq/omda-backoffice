import { supabase } from '@/lib/supabase';
import type { StatutOeuvre } from '@/types/enums';
import type { Attestation, OeuvreDetail, OeuvreRow, PaiementResume } from '@/types/models';
import { UserFacingError } from '@/utils/errors';
import { cleanTerm, rangeOf, type ListParams, type Paged } from './helpers';
import { tryCreateNotification } from './notification.service';

export interface OeuvreListParams extends ListParams { statut?: StatutOeuvre; categorieId?: string }

export async function listOeuvres(p: OeuvreListParams): Promise<Paged<OeuvreRow>> {
  const { from, to } = rangeOf(p);
  let q = supabase.from('oeuvre').select(
    `id, titre, annee, statut, date_soumission, created_at,
     categorie:categorie(id, libelle),
     membre:membre(numero_adherent, candidat:candidat(nom, prenom)),
     demande:demande_adhesion(numero_dossier, candidat:candidat(nom, prenom))`,
    { count: 'exact' },
  );
  const term = cleanTerm(p.search ?? '');
  if (term) q = q.ilike('titre', `%${term}%`);
  if (p.statut) q = q.eq('statut', p.statut);
  if (p.categorieId) q = q.eq('categorie_id', p.categorieId);
  q = q.order(p.sortKey ?? 'created_at', { ascending: p.ascending ?? false }).range(from, to);
  const { data, count, error } = await q;
  if (error) throw error;
  return { rows: (data ?? []) as unknown as OeuvreRow[], total: count ?? 0 };
}

export async function getOeuvre(id: string): Promise<OeuvreDetail | null> {
  const { data, error } = await supabase.from('oeuvre').select(
    `*, categorie:categorie(id, libelle),
     membre:membre(id, numero_adherent, utilisateur_id, candidat_id, candidat:candidat(nom, prenom)),
     demande:demande_adhesion(id, numero_dossier, candidat_id, candidat:candidat(nom, prenom))`,
  ).eq('id', id).maybeSingle();
  if (error) throw error;
  return data as unknown as OeuvreDetail | null;
}

export async function listAttestations(oeuvreId: string): Promise<Attestation[]> {
  const { data, error } = await supabase.from('attestation_diffusion').select('*').eq('oeuvre_id', oeuvreId).order('created_at');
  if (error) throw error;
  return (data ?? []) as Attestation[];
}

export async function listPaiementsOfOeuvre(oeuvreId: string): Promise<PaiementResume[]> {
  const { data, error } = await supabase.from('paiement')
    .select('id, type, montant, devise, mode, operateur, statut, reference_interne, date_initiation')
    .eq('oeuvre_id', oeuvreId).order('date_initiation', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PaiementResume[];
}

/** URL signée (60 s). Le bucket de l'attestation n'est pas précisé par le schéma : `oeuvres` par hypothèse. */
export async function getSignedUrl(bucket: 'oeuvres' | 'pieces', path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
  if (error || !data) throw error ?? new UserFacingError("Impossible d'accéder à ce fichier.");
  return data.signedUrl;
}

const now = () => new Date().toISOString();

export async function prendreEnCharge(id: string, agentId: string): Promise<void> {
  const { data, error } = await supabase.from('oeuvre')
    .update({ statut: 'EN_COURS_DE_VALIDATION', agent_id: agentId, updated_at: now() })
    .eq('id', id).eq('statut', 'ENVOYEE').select('id');
  if (error) throw error;
  if (!data?.length) throw new UserFacingError("Cette œuvre n'est plus à prendre en charge : un autre agent l'a peut-être déjà fait.");
}

async function decide(o: OeuvreDetail, agentId: string, statut: 'VALIDEE' | 'REJETEE', motif: string | null): Promise<{ notified: boolean }> {
  // Condition sur le statut actuel : si un autre agent a déjà décidé, on n'écrase pas sa décision.
  const { data, error } = await supabase.from('oeuvre')
    .update({ statut, motif_rejet: motif, agent_id: agentId, date_decision: now(), updated_at: now() })
    .eq('id', o.id).in('statut', ['ENVOYEE', 'EN_COURS_DE_VALIDATION']).select('id');
  if (error) throw error;
  if (!data?.length) throw new UserFacingError("Cette œuvre n'est plus en attente de décision : un autre agent l'a peut-être déjà traitée.");
  const ok = statut === 'VALIDEE';
  const notified = await tryCreateNotification({
    utilisateur_id: o.membre?.utilisateur_id ?? null,
    candidat_id: o.membre?.candidat_id ?? o.demande?.candidat_id ?? null,
    type: ok ? 'OEUVRE_VALIDEE' : 'OEUVRE_REJETEE',
    titre: ok ? 'Œuvre validée' : 'Œuvre rejetée',
    message: ok ? `Votre œuvre « ${o.titre} » a été validée.` : `Votre œuvre « ${o.titre} » a été rejetée. Motif : ${motif}`,
  });
  return { notified };
}

export const validerOeuvre = (o: OeuvreDetail, agentId: string) => decide(o, agentId, 'VALIDEE', null);

export function rejeterOeuvre(o: OeuvreDetail, agentId: string, motif: string) {
  const m = motif.trim();
  if (!m) throw new UserFacingError('Le motif de rejet est obligatoire.');
  return decide(o, agentId, 'REJETEE', m);
}
