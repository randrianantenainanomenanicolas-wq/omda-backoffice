// Edge Function « admin-users » : création, réinitialisation de mot de passe et suppression de comptes du personnel.
// Ces opérations exigent la clé service_role, qui reste côté serveur (variables injectées automatiquement par Supabase).
// Chaque appel est revérifié ici : l'appelant doit être ADMINISTRATEUR actif, quoi que prétende le navigateur.
//
// Déploiement :  npx supabase functions deploy admin-users --project-ref <identifiant-du-projet>
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const fail = (error: string, status = 400) => json({ error }, status);

const rand = (n: number) => {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] % n;
};

/** Mot de passe temporaire de 14 caractères : au moins une majuscule, une minuscule, un chiffre, un symbole. */
function temporaryPassword(): string {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '!@#$%&*?'];
  const all = sets.join('');
  const chars = sets.map((s) => s[rand(s.length)]);
  while (chars.length < 14) chars.push(all[rand(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return fail('Méthode non autorisée.', 405);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return fail('Configuration du service incomplète.', 500);

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return fail('Authentification requise.', 401);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // 1. Qui appelle ? Le jeton est vérifié par Supabase Auth, puis le rôle est lu dans la table (jamais dans le jeton).
  const { data: caller, error: callerError } = await admin.auth.getUser(token);
  if (callerError || !caller.user) return fail('Session invalide ou expirée.', 401);
  const { data: me } = await admin.from('utilisateur').select('id, role, statut').eq('id', caller.user.id).maybeSingle();
  if (!me || me.role !== 'ADMINISTRATEUR' || me.statut === 'DESACTIVE') return fail('Action réservée aux administrateurs.', 403);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return fail('Requête illisible.'); }

  const targetOf = async (userId: string) => {
    const { data } = await admin.from('utilisateur').select('id, role, statut').eq('id', userId).maybeSingle();
    return data;
  };

  // 2. Création d'un compte du personnel
  if (body.action === 'create') {
    const email = String(body.email ?? '').trim().toLowerCase();
    const role = body.role;
    const telephone = typeof body.telephone === 'string' && body.telephone.trim() ? body.telephone.trim() : null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Adresse email invalide.');
    if (role !== 'AGENT' && role !== 'ADMINISTRATEUR') return fail('Rôle invalide.');

    const password = temporaryPassword();
    const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (createError || !created.user) {
      const exists = /already|registered|exists/i.test(createError?.message ?? '');
      return fail(exists ? 'Un compte existe déjà avec cet email.' : 'Création du compte impossible.', exists ? 409 : 500);
    }
    // upsert : un déclencheur éventuel a pu déjà créer la ligne « utilisateur » (rôle MEMBRE) à l'inscription.
    const { error: profileError } = await admin.from('utilisateur').upsert(
      { id: created.user.id, email, telephone, role, statut: 'EN_ATTENTE_CHANGEMENT_MDP', doit_changer_mot_de_passe: true },
      { onConflict: 'id' },
    );
    if (profileError) {
      console.error('admin-users create/profile', profileError);
      await admin.auth.admin.deleteUser(created.user.id); // pas de compte sans profil
      return fail('Création du profil impossible : le compte n’a pas été créé.', 500);
    }
    return json({ id: created.user.id, email, temporaryPassword: password });
  }

  // 3. Réinitialisation du mot de passe
  if (body.action === 'reset_password') {
    const userId = String(body.userId ?? '');
    if (userId === me.id) return fail('Pour votre propre compte, utilisez la page « Mon profil ».');
    const target = await targetOf(userId);
    if (!target) return fail('Utilisateur introuvable.', 404);
    if (target.role === 'MEMBRE') return fail('Le mot de passe d’un membre se gère depuis l’application mobile.');

    const password = temporaryPassword();
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) { console.error('admin-users reset', error); return fail('Réinitialisation impossible.', 500); }
    const patch: Record<string, unknown> = { doit_changer_mot_de_passe: true, updated_at: new Date().toISOString() };
    if (target.statut !== 'DESACTIVE') patch.statut = 'EN_ATTENTE_CHANGEMENT_MDP'; // un compte désactivé le reste
    await admin.from('utilisateur').update(patch).eq('id', userId);
    return json({ temporaryPassword: password });
  }

  // 4. Suppression d'un compte du personnel
  if (body.action === 'delete') {
    const userId = String(body.userId ?? '');
    if (userId === me.id) return fail('Vous ne pouvez pas supprimer votre propre compte.');
    const target = await targetOf(userId);
    if (!target) return fail('Utilisateur introuvable.', 404);
    if (target.role === 'MEMBRE') return fail('Un compte membre ne se supprime pas ici : désactivez-le.');

    if (target.role === 'ADMINISTRATEUR') {
      const { count } = await admin.from('utilisateur').select('id', { count: 'exact', head: true })
        .eq('role', 'ADMINISTRATEUR').neq('statut', 'DESACTIVE').neq('id', userId);
      if (!count) return fail('Impossible : ce serait le dernier administrateur actif.', 409);
    }

    // Le profil d'abord : si des dossiers y sont rattachés (clé étrangère), tout s'arrête sans rien casser.
    const { error: profileError } = await admin.from('utilisateur').delete().eq('id', userId);
    if (profileError) {
      const linked = profileError.code === '23503';
      if (!linked) console.error('admin-users delete/profile', profileError);
      return fail(linked ? 'Ce compte est lié à des dossiers traités : désactivez-le plutôt que de le supprimer.' : 'Suppression impossible.', linked ? 409 : 500);
    }
    const { error: authError } = await admin.auth.admin.deleteUser(userId);
    if (authError && !/not found/i.test(authError.message)) {
      console.error('admin-users delete/auth', authError);
      return fail('Le profil est supprimé mais pas le compte de connexion : contactez un administrateur technique.', 500);
    }
    return json({ ok: true });
  }

  return fail('Action inconnue.');
});
