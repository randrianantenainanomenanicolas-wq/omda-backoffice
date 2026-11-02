import { describe, expect, it } from 'vitest';
import { controleDossier, regleValidation, resumeManques } from './dossier';

const pieces4 = (['PHOTO', 'CIN', 'ACTE_NAISSANCE', 'CERTIFICAT_RESIDENCE'] as const).map((type) => ({ type }));
const ok = [{ titre: 'A', nbAttestations: 1 }, { titre: 'B', nbAttestations: 1 }];
const base = { dateNaissance: '1990-01-01', dateSoumission: '2026-10-01T08:00:00Z' };

describe('validation du dossier', () => {
  const complet = controleDossier({ ...base, pieces: pieces4, oeuvres: ok });
  const incomplet = controleDossier({ ...base, pieces: pieces4.slice(0, 2), oeuvres: [{ titre: 'A', nbAttestations: 0 }] });

  it('autorise tout le personnel quand le dossier est complet', () => {
    expect(regleValidation(complet, false)).toEqual({ bloquee: false, avertir: false });
    expect(regleValidation(complet, true)).toEqual({ bloquee: false, avertir: false });
  });
  it("bloque un agent sur un dossier incomplet, avertit l'administrateur", () => {
    expect(regleValidation(incomplet, false)).toEqual({ bloquee: true, avertir: false });
    expect(regleValidation(incomplet, true)).toEqual({ bloquee: false, avertir: true });
  });
  it("bloque tout le monde tant que le contrôle n'est pas chargé", () => {
    expect(regleValidation(null, true).bloquee).toBe(true);
  });
  it('résume les éléments manquants', () => {
    expect(resumeManques(complet)).toEqual([]);
    expect(resumeManques(incomplet)).toEqual(['2 pièces obligatoires manquantes', '2 œuvres minimum requises (1 déposée)', '1 œuvre sans attestation de diffusion']);
  });
});
