-- =====================================================================
-- OMDA : SÉCURITÉ ET FONCTIONNEMENT DU BACK OFFICE : FICHIER UNIQUE
-- Regroupe, dans le bon ordre, tous les correctifs SQL construits pour ce projet.
-- À exécuter dans Supabase > SQL Editor, sur le projet utilisé par le Back Office
-- (celui de VITE_SUPABASE_URL).
--
--   PARTIE 0   Garde-fou : refuse de s'exécuter s'il n'existe aucun administrateur actif.
--   PARTIE 1   Rôles lus dans la table, anti-auto-promotion, notifications du personnel,
--              paiements non falsifiables, journal en lecture seule.
--   PARTIE 2   Suppressions réservées aux administrateurs (boutons « Supprimer »).
--   PARTIE 3   Stockage privé (pièces d'identité, œuvres) : OPTIONNELLE, en commentaire.
--
-- Les parties 0, 1 et 2 forment UNE SEULE transaction : si une instruction échoue, rien n'est
-- modifié et le message d'erreur indique laquelle. Le fichier peut être relancé sans danger.
--
-- AVANT : sauvegarder (Database > Backups), ou au moins exporter les politiques :
--   select * from pg_policies where schemaname in ('public','storage');
-- APRÈS : lancer les vérifications tout en bas, puis tester le Back Office et le mobile.
-- =====================================================================

begin;

-- =====================================================================
-- PARTIE 0 : Garde-fou anti-verrouillage
-- Le fichier redéfinit is_admin() : sans administrateur actif dans la table utilisateur,
-- plus personne ne pourrait gérer les comptes ni les paramètres.
-- =====================================================================
do $$
begin
  if not exists (
    select 1 from public.utilisateur
    where role = 'ADMINISTRATEUR' and statut <> 'DESACTIVE'
  ) then
    raise exception 'Arrêt : aucun administrateur actif dans public.utilisateur. Créez ou réactivez un administrateur avant d''exécuter ce fichier.';
  end if;
end $$;

-- =====================================================================
-- PARTIE 1 : Rôles, anti-auto-promotion, notifications, paiements, journal
-- =====================================================================
-- ---------------------------------------------------------------------
-- 1. Fonctions de rôle : le rôle vient de la TABLE utilisateur, jamais
--    des métadonnées du jeton (user_metadata est modifiable par l'utilisateur).
--    SECURITY DEFINER : lit la table sans repasser par la RLS (pas de récursion).
--    Un compte DESACTIVE n'a plus aucun pouvoir, même avec une session ouverte.
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.utilisateur u
    where u.id = auth.uid()
      and u.role = 'ADMINISTRATEUR'
      and u.statut <> 'DESACTIVE'
  );
$$;

create or replace function public.is_agent_or_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.utilisateur u
    where u.id = auth.uid()
      and u.role in ('AGENT', 'ADMINISTRATEUR')
      and u.statut <> 'DESACTIVE'
  );
$$;

-- ---------------------------------------------------------------------
-- 2. Plus d'auto-promotion de rôle.
--    La politique utilisateur_update_self_or_admin laisse chacun modifier sa
--    propre ligne : sans ce trigger, un agent (ou un membre) pourrait se
--    donner le rôle ADMINISTRATEUR, ou se réactiver après désactivation.
--    Un non-administrateur ne peut modifier ni id, email, rôle, created_at,
--    ni le statut, sauf la levée du blocage « changement de mot de passe
--    requis » (EN_ATTENTE_CHANGEMENT_MDP -> ACTIF), utilisée par le Back Office.
--    Le SQL Editor, le service_role (serveur Express) et Supabase Auth ne
--    passent pas par les rôles authenticated/anon : ils ne sont pas bridés.
-- ---------------------------------------------------------------------
create or replace function public.utilisateur_protege_champs()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if public.is_admin() then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.email is distinct from old.email
     or new.role is distinct from old.role
     or new.created_at is distinct from old.created_at then
    raise exception 'Modification interdite : identifiant, email et rôle sont réservés aux administrateurs.'
      using errcode = '42501';
  end if;

  if new.statut is distinct from old.statut
     and not (old.statut = 'EN_ATTENTE_CHANGEMENT_MDP' and new.statut = 'ACTIF') then
    raise exception 'Modification interdite : le statut du compte est réservé aux administrateurs.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_utilisateur_protege_champs on public.utilisateur;
create trigger trg_utilisateur_protege_champs
  before update on public.utilisateur
  for each row execute function public.utilisateur_protege_champs();

-- ---------------------------------------------------------------------
-- 3. Notifications envoyées par le Back Office.
--    Aucune politique INSERT n'existait sur notification : toutes les
--    notifications créées par le personnel (validation / rejet d'une demande
--    ou d'une œuvre, notification globale) étaient refusées par la RLS.
-- ---------------------------------------------------------------------
drop policy if exists notification_insert_staff on public.notification;
create policy notification_insert_staff on public.notification
  for insert to authenticated
  with check (public.is_agent_or_admin());

-- ---------------------------------------------------------------------
-- 4. Paiement : un candidat ou un membre ne peut créer qu'un paiement INITIE.
--    Avant, rien n'empêchait d'insérer directement une ligne statut = 'REUSSI',
--    donc de simuler un paiement réussi sans payer.
--    (Le serveur, via service_role, fait passer le paiement à REUSSI.)
-- ---------------------------------------------------------------------
drop policy if exists paiement_insert_owner_or_staff on public.paiement;
create policy paiement_insert_owner_or_staff on public.paiement
  for insert to authenticated
  with check (
    public.is_agent_or_admin()
    or (
      statut = 'INITIE'
      and (
        candidat_id in (select c.id from public.candidat c where c.utilisateur_id = auth.uid())
        or membre_id in (select m.id from public.membre m where m.utilisateur_id = auth.uid())
      )
    )
  );

-- ---------------------------------------------------------------------
-- 5. Journal des paiements : lecture seule pour le personnel.
--    La politique ALL permettait à un agent de modifier ou d'effacer des
--    lignes du journal. Le Back Office ne fait que lire ; le serveur écrit
--    avec service_role.
-- ---------------------------------------------------------------------
drop policy if exists journal_staff_only on public.journal_paiement;
drop policy if exists journal_staff_select on public.journal_paiement;
create policy journal_staff_select on public.journal_paiement
  for select to authenticated
  using (public.is_agent_or_admin());

-- =====================================================================
-- PARTIE 2 : Suppressions réservées aux administrateurs
-- Sans elle, la base refuse tous les boutons « Supprimer » du Back Office.
-- Garde-fous aussi dans la base : un paiement REUSSI, une demande VALIDEE /
-- ADHESION_TERMINEE et une œuvre au dépôt finalisé ne se suppriment jamais.
-- =====================================================================
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
-- PARTIE 3 (OPTIONNELLE) : Stockage privé
-- Aujourd'hui, n'importe qui, sans compte, peut lire et déposer des fichiers dans les
-- buckets « pieces » (CIN, autorisations parentales) et « oeuvres ».
-- Ce correctif peut CASSER l'application mobile ou l'API si elles lisent ces fichiers par
-- lien public ou les envoient sans session. À appliquer SEULEMENT après test sur un projet
-- de test, puis vérification du mobile (liste en bas du bloc).
-- Pour l'activer : retirer les « -- » des blocs A (et B si besoin) ci-dessous.
-- =====================================================================

-- Étape 0 : état actuel des buckets (public = true => lisible par lien direct)
--   select id, public from storage.buckets;

-- ---- Bloc A : lecture réservée au personnel ----
-- begin;
-- update storage.buckets set public = false where id in ('pieces', 'oeuvres');
--
-- drop policy if exists "Autoriser lecture pieces" on storage.objects;
-- drop policy if exists "Autoriser lecture oeuvres" on storage.objects;
-- drop policy if exists staff_lecture_pieces_oeuvres on storage.objects;
--
-- create policy staff_lecture_pieces_oeuvres on storage.objects
--   for select to authenticated
--   using (bucket_id in ('pieces', 'oeuvres') and public.is_agent_or_admin());
-- commit;

-- ---- Bloc B : dépôt réservé aux utilisateurs connectés ----
-- À n'appliquer QUE si les envois de fichiers se font avec un utilisateur connecté, ou
-- uniquement depuis le serveur Express (service_role). Si le formulaire de candidature
-- envoie directement les fichiers depuis le mobile SANS compte, ne pas l'appliquer.
-- begin;
-- drop policy if exists "Autoriser upload pieces" on storage.objects;
-- drop policy if exists "Autoriser upload oeuvres" on storage.objects;
-- drop policy if exists upload_pieces_oeuvres_connecte on storage.objects;
-- create policy upload_pieces_oeuvres_connecte on storage.objects
--   for insert to authenticated
--   with check (bucket_id in ('pieces', 'oeuvres'));
-- commit;

-- À tester après application des blocs A / B :
--   1. Back Office : ouvrir une pièce et un fichier d'œuvre (doit marcher).
--   2. Mobile, candidat : envoyer un dossier avec pièces et œuvres.
--   3. Mobile, membre : déposer une œuvre, puis ouvrir / écouter ses propres fichiers.
--   4. Navigateur NON connecté : ouvrir le lien d'une ancienne pièce (doit refuser).
-- Retour en arrière rapide du bloc A :
--   update storage.buckets set public = true where id in ('pieces','oeuvres');
--   create policy "Autoriser lecture pieces" on storage.objects for select to public using (bucket_id = 'pieces');
--   create policy "Autoriser lecture oeuvres" on storage.objects for select to public using (bucket_id = 'oeuvres');

-- =====================================================================
-- VÉRIFICATIONS (à lancer une par une, sans les « -- »)
-- =====================================================================
-- 1. Fonctions et trigger présents (3 lignes, puis 1 ligne) :
--    select proname from pg_proc where proname in ('is_admin','is_agent_or_admin','utilisateur_protege_champs');
--    select tgname from pg_trigger where tgname = 'trg_utilisateur_protege_champs';
--
-- 2. Comptes du personnel (votre administrateur doit apparaître) :
--    select email, role, statut from public.utilisateur where role <> 'MEMBRE' order by role, email;
--
-- 3. Nouvelles politiques en place :
--    select tablename, policyname, cmd from pg_policies
--    where policyname in ('notification_insert_staff','paiement_insert_owner_or_staff','journal_staff_select',
--      'candidat_delete_admin','demande_delete_admin','piece_delete_admin','oeuvre_delete_admin',
--      'attestation_delete_admin','paiement_delete_admin','notification_delete_admin',
--      'membre_delete_admin','membre_categorie_delete_admin','admin_delete_pieces_oeuvres')
--    order by tablename, policyname;
--
-- 4. Test d'auto-promotion : connecté en AGENT, tenter de se donner le rôle
--    ADMINISTRATEUR doit échouer avec « Modification interdite ».
--
-- 5. Tables sans RLS (ne doit renvoyer aucune table sensible) :
--    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
--
-- 6. Comportement des clés étrangères à la suppression (CASCADE = enfants effacés avec le parent ;
--    NO ACTION / RESTRICT = suppression refusée tant que des enfants existent) :
--    select conrelid::regclass as table_enfant, conname, confrelid::regclass as table_parent,
--      case confdeltype when 'a' then 'NO ACTION' when 'r' then 'RESTRICT' when 'c' then 'CASCADE'
--                       when 'n' then 'SET NULL' when 'd' then 'SET DEFAULT' end as a_la_suppression
--    from pg_constraint where contype = 'f' and connamespace = 'public'::regnamespace
--    order by confrelid::regclass::text;
