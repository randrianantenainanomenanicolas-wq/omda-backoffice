import { describe, expect, it } from 'vitest';
import { ageAu, controleDossier, estHorsDelai } from './dossier';

const pieces4 = (['PHOTO', 'CIN', 'ACTE_NAISSANCE', 'CERTIFICAT_RESIDENCE'] as const).map((type) => ({ type }));
const oeuvres = [{ titre: 'A', nbAttestations: 1 }, { titre: 'B', nbAttestations: 1 }];

describe('dossier', () => {
  it('calcule l\'âge à une date donnée', () => {
    expect(ageAu('2010-06-15', new Date('2026-06-14'))).toBe(15);
    expect(ageAu('2010-06-15', new Date('2026-06-15'))).toBe(16);
  });
  it('un majeur avec 4 pièces et 2 œuvres attestées est complet', () => {
    expect(controleDossier({ dateNaissance: '1990-01-01', dateSoumission: '2026-09-01T00:00:00Z', pieces: pieces4, oeuvres }).complet).toBe(true);
  });
  it('exige l\'autorisation parentale entre 15 et 17 ans', () => {
    const c = controleDossier({ dateNaissance: '2010-01-01', dateSoumission: '2026-09-01T00:00:00Z', pieces: pieces4, oeuvres });
    expect(c.autorisationParentaleRequise).toBe(true);
    expect(c.piecesManquantes).toEqual(['AUTORISATION_PARENTALE']);
    expect(c.complet).toBe(false);
  });
  it('signale une œuvre sans attestation ou moins de 2 œuvres', () => {
    const c = controleDossier({ dateNaissance: '1990-01-01', dateSoumission: null, pieces: pieces4, oeuvres: [{ titre: 'A', nbAttestations: 0 }] });
    expect(c.oeuvresSansAttestation).toEqual(['A']);
    expect(c.complet).toBe(false);
  });
  it('détecte le dépassement du délai indicatif de 72 h', () => {
    const now = new Date('2026-09-10T12:00:00Z');
    expect(estHorsDelai('ENVOYEE', '2026-09-07T11:00:00Z', now)).toBe(true);
    expect(estHorsDelai('ENVOYEE', '2026-09-08T12:00:00Z', now)).toBe(false);
    expect(estHorsDelai('VALIDEE', '2026-09-01T12:00:00Z', now)).toBe(false);
  });
});
