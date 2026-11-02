export interface Strength { score: 0 | 1 | 2 | 3 | 4; label: string }

/** Indicateur d'aide à la saisie (la règle imposée reste « au moins 8 caractères »). */
export function passwordStrength(pwd: string): Strength {
  if (!pwd) return { score: 0, label: '' };
  if (pwd.length < 8) return { score: 1, label: 'Trop court' };
  const criteria = [pwd.length >= 12, /[a-z]/.test(pwd) && /[A-Z]/.test(pwd), /\d/.test(pwd), /[^A-Za-z0-9]/.test(pwd)];
  const met = criteria.filter(Boolean).length;
  const score = Math.min(4, met + 1) as 1 | 2 | 3 | 4;
  return { score, label: ['', 'Faible', 'Moyen', 'Bon', 'Fort'][score] };
}
