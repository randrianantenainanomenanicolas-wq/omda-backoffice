import { describe, expect, it } from 'vitest';
import { UserFacingError, toFrenchMessage } from './errors';

describe('toFrenchMessage', () => {
  it('traduit les identifiants invalides', () => {
    expect(toFrenchMessage(new Error('Invalid login credentials'), 'x')).toBe('Email ou mot de passe incorrect.');
  });
  it('reconnaît une violation RLS venant de PostgREST (objet non-Error)', () => {
    expect(toFrenchMessage({ message: 'new row violates row-level security policy' }, 'x')).toContain('droits');
  });
  it('distingue le tarif actif en doublon du doublon générique', () => {
    expect(toFrenchMessage({ message: 'duplicate key value violates unique constraint "tarif_actif_unique"' }, 'x')).toContain('tarif actif');
  });
  it('renvoie le message des erreurs métier tel quel', () => {
    expect(toFrenchMessage(new UserFacingError('Motif obligatoire.'), 'x')).toBe('Motif obligatoire.');
  });
  it('utilise le message par défaut pour une erreur inconnue', () => {
    expect(toFrenchMessage(new Error('boom'), 'Échec.')).toBe('Échec.');
  });
  it('explique une suppression bloquée par une clé étrangère', () => {
    expect(toFrenchMessage({ message: 'update or delete on table "membre" violates foreign key constraint "oeuvre_membre_fk" on table "oeuvre"' }, 'x')).toContain('Suppression impossible');
  });
});
