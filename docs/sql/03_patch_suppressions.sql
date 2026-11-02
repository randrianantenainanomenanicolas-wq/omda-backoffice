-- =====================================================================
-- OMDA : PATCH n°3  (suppressions réservées aux administrateurs)
-- À appliquer APRÈS le patch n°1 (il utilise public.is_admin()).
-- Sans lui, les boutons « Supprimer » du Back Office sont refusés par la base :
-- aucune politique DELETE n'existait sur candidat, demande_adhesion, oeuvre,
-- paiement, piece, attestation_diffusion et notification.
--
-- Les garde-fous métier sont aussi dans la base (défense en profondeur) :
--   * un paiement REUSSI (pièce comptable) ne se supprime jamais ;
--   * une demande VALIDEE / ADHESION_TERMINEE ne se supprime pas ;
--   * une œuvre au dépôt finalisé ne se supprime pas.
-- =====================================================================

begin;

drop policy if exists candidat_delete_admin on public.candidat;
create policy candidat_delete_admin on public.candidat
  for delete to authenticated using (public.is_admin());

drop policy if exists demande_delete_admin on public.demande_adhesion;
create policy demande_delete_admin on public.demande_adhesion
  for delete to authenticated
  using (public.is_admin() and statut not in ('VALIDEE', 'ADHESION_TERMINEE'));

drop policy if exists piece_delete_admin on public.piece;
create policy piece_delete_admin on public.piece
  for delete to authenticated using (public.is_admin());

drop policy if exists oeuvre_delete_admin on public.oeuvre;
create policy oeuvre_delete_admin on public.oeuvre
  for delete to authenticated
  using (public.is_admin() and statut <> 'DEPOT_FINALISE');

drop policy if exists attestation_delete_admin on public.attestation_diffusion;
create policy attestation_delete_admin on public.attestation_diffusion
  for delete to authenticated using (public.is_admin());

drop policy if exists paiement_delete_admin on public.paiement;
create policy paiement_delete_admin on public.paiement
  for delete to authenticated
  using (public.is_admin() and statut <> 'REUSSI');

drop policy if exists notification_delete_admin on public.notification;
create policy notification_delete_admin on public.notification
  for delete to authenticated using (public.is_admin());

-- membre et membre_categorie : les politiques « ALL » du personnel autorisaient aussi les agents à supprimer.
-- On les remplace : insertion et modification restent ouvertes au personnel, la suppression passe aux administrateurs.
drop policy if exists membre_staff_manage on public.membre;
drop policy if exists membre_staff_insert on public.membre;
drop policy if exists membre_staff_update on public.membre;
drop policy if exists membre_delete_admin on public.membre;
create policy membre_staff_insert on public.membre
  for insert to authenticated with check (public.is_agent_or_admin());
create policy membre_staff_update on public.membre
  for update to authenticated using (public.is_agent_or_admin()) with check (public.is_agent_or_admin());
create policy membre_delete_admin on public.membre
  for delete to authenticated using (public.is_admin());

drop policy if exists membre_categorie_staff_all on public.membre_categorie;
drop policy if exists membre_categorie_staff_insert on public.membre_categorie;
drop policy if exists membre_categorie_staff_update on public.membre_categorie;
drop policy if exists membre_categorie_delete_admin on public.membre_categorie;
create policy membre_categorie_staff_insert on public.membre_categorie
  for insert to authenticated with check (public.is_agent_or_admin());
create policy membre_categorie_staff_update on public.membre_categorie
  for update to authenticated using (public.is_agent_or_admin()) with check (public.is_agent_or_admin());
create policy membre_categorie_delete_admin on public.membre_categorie
  for delete to authenticated using (public.is_admin());

-- Fichiers : l'administrateur peut retirer les pièces et œuvres d'un dossier supprimé.
drop policy if exists admin_delete_pieces_oeuvres on storage.objects;
create policy admin_delete_pieces_oeuvres on storage.objects
  for delete to authenticated
  using (bucket_id in ('pieces', 'oeuvres') and public.is_admin());

commit;

-- =====================================================================
-- À VÉRIFIER AVANT / APRÈS : que se passe-t-il à la suppression d'une ligne parente ?
-- Cette requête liste chaque clé étrangère et son comportement. « CASCADE » veut dire que
-- supprimer le parent efface aussi les enfants ; « NO ACTION » / « RESTRICT » veut dire que
-- la suppression est refusée tant que des enfants existent (le Back Office l'explique alors).
--
--   select conrelid::regclass as table_enfant, conname, confrelid::regclass as table_parent,
--     case confdeltype when 'a' then 'NO ACTION' when 'r' then 'RESTRICT' when 'c' then 'CASCADE'
--                      when 'n' then 'SET NULL' when 'd' then 'SET DEFAULT' end as a_la_suppression
--   from pg_constraint
--   where contype = 'f' and connamespace = 'public'::regnamespace
--   order by confrelid::regclass::text;
-- =====================================================================
