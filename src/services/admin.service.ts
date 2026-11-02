import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { RoleUtilisateur } from '@/types/enums';
import { UserFacingError } from '@/utils/errors';

/**
 * Création, réinitialisation de mot de passe et suppression de comptes : ces opérations exigent la clé
 * `service_role`, qui ne doit JAMAIS être dans le navigateur. Elles passent par l'Edge Function `admin-users`
 * (voir supabase/functions/admin-users), qui revérifie que l'appelant est administrateur.
 */
async function call<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-users', { body: { action, ...payload } });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const status = error.context.status;
      let message: string | undefined;
      try {
        const body = JSON.parse(await error.context.text()) as { error?: string; message?: string };
        message = body.error; // message en français renvoyé par notre fonction
      } catch { /* corps non JSON */ }
      if (message) throw new UserFacingError(message);
      if (status === 404) throw new UserFacingError("La fonction « admin-users » est introuvable : elle n'est pas déployée sur ce projet Supabase (voir le README).");
      if (status === 401) throw new UserFacingError("Supabase a refusé la session (erreur 401). Reconnectez-vous ; si cela persiste, redéployez la fonction avec l'option --no-verify-jwt.");
      throw new UserFacingError(`Le service d'administration a répondu par une erreur ${status}. Consultez les journaux de la fonction dans Supabase.`);
    }
    if (error instanceof FunctionsFetchError) {
      throw new UserFacingError("Impossible de joindre la fonction « admin-users » (réseau, ou fonction non déployée).");
    }
    throw new UserFacingError("Le serveur de fonctions Supabase est injoignable. Réessayez dans un instant.");
  }
  if (data && typeof data === 'object' && 'error' in data) throw new UserFacingError(String((data as { error: unknown }).error));
  return data as T;
}

export type StaffRole = Exclude<RoleUtilisateur, 'MEMBRE'>;
export interface CreatedUser { id: string; email: string; temporaryPassword: string }

export const createStaffUser = (v: { email: string; role: StaffRole; telephone: string | null }) => call<CreatedUser>('create', v);
export const resetUserPassword = (userId: string) => call<{ temporaryPassword: string }>('reset_password', { userId });
export const deleteStaffUser = (userId: string) => call<{ ok: true }>('delete', { userId });
