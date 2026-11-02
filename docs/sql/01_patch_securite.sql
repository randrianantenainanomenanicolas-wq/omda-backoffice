-- =====================================================================
-- OMDA : PATCH DE SÉCURITÉ n°1  (à appliquer maintenant)
-- Écrit à partir des politiques RLS réelles exportées depuis pg_policies.
-- À exécuter dans Supabase > SQL Editor. Idempotent : peut être relancé.
-- Faire d'abord un test sur une copie / un projet de test si possible.
-- =====================================================================

begin;

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

commit;

-- =====================================================================
-- VÉRIFICATIONS (à lancer après le patch, une par une)
-- =====================================================================
-- a) Les fonctions et le trigger existent :
--    select proname from pg_proc where proname in ('is_admin','is_agent_or_admin','utilisateur_protege_champs');
--    select tgname from pg_trigger where tgname = 'trg_utilisateur_protege_champs';
--
-- b) Test d'auto-promotion (doit ÉCHOUER avec « Modification interdite »).
--    Se connecter au Back Office avec un compte AGENT, ouvrir la console du
--    navigateur et lancer, ou utiliser l'API REST avec le jeton de l'agent :
--      update utilisateur set role = 'ADMINISTRATEUR' where id = <id de l'agent>
--
-- c) Tables sans RLS (doit ne renvoyer AUCUNE ligne utile) :
--    select c.relname, c.relrowsecurity
--    from pg_class c join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
