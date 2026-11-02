// Erreur destinée à l'utilisateur : le message est déjà en français et affichable tel quel.
export class UserFacingError extends Error {}

const KNOWN: Array<[RegExp, string]> = [
  [/invalid login credentials/i, 'Email ou mot de passe incorrect.'],
  [/email not confirmed/i, "Cette adresse email n'a pas encore été confirmée."],
  [/rate limit|too many/i, 'Trop de tentatives. Veuillez réessayer dans quelques instants.'],
  [/failed to fetch|network/i, 'Connexion impossible. Vérifiez votre connexion internet.'],
  [/tarif_actif_unique/i, 'Un tarif actif existe déjà pour cette opération et cette catégorie.'],
  [/tarif_dates_chk/i, 'La date de fin doit être postérieure ou égale à la date de début.'],
  [/duplicate key|unique constraint/i, 'Cette valeur existe déjà (doublon avec un enregistrement existant).'],
  [/candidat_age_min_chk/i, 'Le candidat doit avoir au moins 15 ans.'],
  [/foreign key constraint|violates foreign key/i, "Suppression impossible : d'autres enregistrements en dépendent. Supprimez-les d'abord, ou désactivez cet élément au lieu de le supprimer."],
  [/row-level security|permission denied/i, "Vous n'avez pas les droits nécessaires pour cette opération."],
];

/** Convertit toute erreur technique en message français compréhensible. */
export function toFrenchMessage(error: unknown, fallback: string): string {
  if (error instanceof UserFacingError) return error.message;
  const raw = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error
    ? String((error as { message: unknown }).message) : '';
  for (const [re, msg] of KNOWN) if (re.test(raw)) return msg;
  return fallback;
}
