import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Utilisateur } from '@/types/models';
import { UserFacingError } from '@/utils/errors';

/** Profil applicatif : utilisateur.id = auth.users.id (lien défini par le schéma). */
export async function fetchProfile(userId: string): Promise<Utilisateur | null> {
  const { data, error } = await supabase.from('utilisateur').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data as Utilisateur | null;
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/** Connexion via Supabase Auth, puis contrôle d'accès au Back Office (AGENT / ADMINISTRATEUR actifs). */
export async function login(email: string, password: string): Promise<Utilisateur> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const profile = await fetchProfile(data.user.id);
  if (!profile) {
    await supabase.auth.signOut();
    throw new UserFacingError("Aucun profil OMDA n'est associé à ce compte.");
  }
  if (profile.role === 'MEMBRE') {
    await supabase.auth.signOut();
    throw new UserFacingError("Accès réservé au personnel de l'OMDA (agents et administrateurs).");
  }
  if (profile.statut === 'DESACTIVE') {
    await supabase.auth.signOut();
    throw new UserFacingError('Ce compte a été désactivé. Contactez un administrateur.');
  }
  // Trace de connexion « au mieux » : un échec ne doit jamais empêcher la connexion.
  await supabase.from('utilisateur').update({ derniere_connexion_at: new Date().toISOString() }).eq('id', profile.id);
  return profile;
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function updateOwnPhone(userId: string, telephone: string | null): Promise<void> {
  const { error } = await supabase.from('utilisateur').update({ telephone, updated_at: new Date().toISOString() }).eq('id', userId);
  if (error) throw error;
}

/** Change le mot de passe (Supabase Auth) puis lève le blocage « changement de mot de passe requis » si besoin. */
export async function changePassword(userId: string, newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  const { error: e2 } = await supabase.from('utilisateur')
    .update({ statut: 'ACTIF', doit_changer_mot_de_passe: false, updated_at: new Date().toISOString() })
    .eq('id', userId).eq('statut', 'EN_ATTENTE_CHANGEMENT_MDP');
  if (e2) throw e2;
}
