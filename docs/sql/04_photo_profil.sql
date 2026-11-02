-- =====================================================================
-- OMDA : PHOTO DE PROFIL (fonction facultative)
-- Ajoute la colonne utilisateur.photo_path et un bucket PRIVÉ « avatars ».
-- À exécuter dans Supabase > SQL Editor, après le fichier de sécurité (il utilise
-- public.is_agent_or_admin() et public.is_admin()). Peut être relancé sans danger.
--
-- Règles : chacun envoie et modifie uniquement les fichiers de son propre dossier
-- « <id de l'utilisateur>/ » ; le personnel peut les lire ; un administrateur peut les supprimer.
-- Le bucket impose 2 Mo maximum et les formats JPEG, PNG, WebP.
-- Le Back Office recadre et réduit déjà la photo (512 px, quelques dizaines de Ko).
-- =====================================================================

begin;

alter table public.utilisateur add column if not exists photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists avatars_select on storage.objects;
create policy avatars_select on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_agent_or_admin()));

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_delete on storage.objects;
create policy avatars_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

commit;

-- VÉRIFICATIONS
--   select column_name from information_schema.columns
--   where table_schema = 'public' and table_name = 'utilisateur' and column_name = 'photo_path';   -- 1 ligne
--   select id, public, file_size_limit from storage.buckets where id = 'avatars';                  -- public = false
--   select policyname from pg_policies where tablename = 'objects' and policyname like 'avatars_%'; -- 4 lignes
