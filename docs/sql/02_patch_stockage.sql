-- =====================================================================
-- OMDA : PATCH DE SÉCURITÉ n°2  (STOCKAGE : à tester avant de l'appliquer)
-- Les politiques actuelles donnent au rôle « public » (donc à n'importe qui,
-- sans compte) la lecture ET le dépôt de fichiers dans les buckets
-- « pieces » (CIN, autorisations parentales) et « oeuvres ».
--
-- ATTENTION : ce patch peut casser des écrans du mobile ou de l'API si ils
-- lisent ces fichiers par lien public, ou envoient les fichiers sans session.
-- Ce que le Back Office utilise est compatible : il passe par des URL signées.
-- Procédure : d'abord un projet de test, puis vérifier l'application mobile
-- (voir la liste en bas), puis la production.
-- =====================================================================

-- Étape 0 : regarder l'état actuel des buckets (public = true => lisible par lien direct)
--   select id, public from storage.buckets;

begin;

-- ---------------------------------------------------------------------
-- A. Lecture : plus de lecture publique. Le personnel lit via URL signée.
-- ---------------------------------------------------------------------
update storage.buckets set public = false where id in ('pieces', 'oeuvres');

drop policy if exists "Autoriser lecture pieces" on storage.objects;
drop policy if exists "Autoriser lecture oeuvres" on storage.objects;
drop policy if exists staff_lecture_pieces_oeuvres on storage.objects;

create policy staff_lecture_pieces_oeuvres on storage.objects
  for select to authenticated
  using (bucket_id in ('pieces', 'oeuvres') and public.is_agent_or_admin());

commit;

-- ---------------------------------------------------------------------
-- B. Dépôt : à n'appliquer QUE si les envois de fichiers se font avec un
--    utilisateur connecté, ou uniquement depuis le serveur Express (service_role).
--    Si le formulaire de candidature envoie les fichiers directement depuis le
--    mobile SANS compte, ne pas exécuter ce bloc : l'envoi cesserait de marcher.
--    (Décommenter pour appliquer.)
-- ---------------------------------------------------------------------
-- begin;
-- drop policy if exists "Autoriser upload pieces" on storage.objects;
-- drop policy if exists "Autoriser upload oeuvres" on storage.objects;
-- drop policy if exists upload_pieces_oeuvres_connecte on storage.objects;
-- create policy upload_pieces_oeuvres_connecte on storage.objects
--   for insert to authenticated
--   with check (bucket_id in ('pieces', 'oeuvres'));
-- commit;

-- =====================================================================
-- À TESTER APRÈS APPLICATION
-- =====================================================================
-- 1. Back Office : ouvrir une pièce et un fichier d'œuvre (doit toujours marcher).
-- 2. Mobile, candidat : envoyer un dossier avec pièces et œuvres.
-- 3. Mobile, membre : déposer une œuvre, puis ouvrir / écouter ses propres fichiers.
--    Si cette lecture passe par un lien public, elle ne marchera plus : il faudra
--    soit générer une URL signée côté serveur, soit ajouter une politique de lecture
--    pour le propriétaire (il faut connaître la convention de chemin des fichiers).
-- 4. Depuis un navigateur NON connecté, ouvrir le lien d'une ancienne pièce :
--    la réponse doit être « not found » ou « unauthorized ».
--
-- Retour en arrière rapide (si besoin) :
--   update storage.buckets set public = true where id in ('pieces','oeuvres');
--   create policy "Autoriser lecture pieces" on storage.objects for select to public using (bucket_id = 'pieces');
--   create policy "Autoriser lecture oeuvres" on storage.objects for select to public using (bucket_id = 'oeuvres');
