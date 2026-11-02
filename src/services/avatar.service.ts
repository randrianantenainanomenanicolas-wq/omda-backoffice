import { supabase } from '@/lib/supabase';
import { UserFacingError } from '@/utils/errors';

export const AVATAR_BUCKET = 'avatars';

const NOT_READY = "La photo de profil n'est pas encore activée sur ce projet : appliquez le script docs/sql/04_photo_profil.sql dans Supabase (SQL Editor).";

/** Colonne ou bucket absents : on explique quoi faire au lieu d'afficher une erreur technique. */
function explain(e: unknown): never {
  const message = (e as { message?: string } | null)?.message ?? '';
  if (/photo_path|schema cache|does not exist|bucket not found/i.test(message)) throw new UserFacingError(NOT_READY);
  throw e;
}

/** Lien temporaire (1 h) : le bucket est privé. */
export async function getAvatarUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

/** Envoie la nouvelle photo, enregistre son chemin, puis efface l'ancienne. Chaque fichier a un nom unique : pas de cache périmé. */
export async function uploadOwnAvatar(userId: string, image: Blob, previousPath?: string | null): Promise<string> {
  const path = `${userId}/avatar-${Date.now()}.jpg`;
  const up = await supabase.storage.from(AVATAR_BUCKET).upload(path, image, { contentType: 'image/jpeg', upsert: false });
  if (up.error) return explain(up.error);

  const { error } = await supabase.from('utilisateur').update({ photo_path: path, updated_at: new Date().toISOString() }).eq('id', userId);
  if (error) {
    await supabase.storage.from(AVATAR_BUCKET).remove([path]); // pas de fichier orphelin
    return explain(error);
  }
  if (previousPath) await supabase.storage.from(AVATAR_BUCKET).remove([previousPath]); // nettoyage « au mieux »
  return path;
}

export async function removeOwnAvatar(userId: string, path: string): Promise<void> {
  const { error } = await supabase.from('utilisateur').update({ photo_path: null, updated_at: new Date().toISOString() }).eq('id', userId);
  if (error) explain(error);
  await supabase.storage.from(AVATAR_BUCKET).remove([path]);
}
