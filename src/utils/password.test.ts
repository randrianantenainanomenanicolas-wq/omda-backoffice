import { describe, expect, it } from 'vitest';
import { passwordStrength } from './password';

describe('passwordStrength', () => {
  it('ne note rien pour un champ vide', () => expect(passwordStrength('')).toEqual({ score: 0, label: '' }));
  it('signale un mot de passe trop court', () => expect(passwordStrength('Ab1!')).toEqual({ score: 1, label: 'Trop court' }));
  it('juge faible un mot de passe de 8 lettres minuscules', () => expect(passwordStrength('abcdefgh').label).toBe('Faible'));
  it('juge fort un mot de passe long, mixte, avec chiffre et symbole', () => expect(passwordStrength('Omda-Bureau2026!').label).toBe('Fort'));
});
