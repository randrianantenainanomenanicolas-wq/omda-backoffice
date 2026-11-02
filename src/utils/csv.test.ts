import { describe, expect, it } from 'vitest';
import { csvCell, toCsv } from './csv';

describe('csv', () => {
  it('protège les séparateurs, guillemets et retours à la ligne', () => {
    expect(csvCell('a;b')).toBe('"a;b"');
    expect(csvCell('dit "oui"')).toBe('"dit ""oui"""');
    expect(csvCell('ligne1\nligne2')).toBe('"ligne1\nligne2"');
  });
  it('laisse vides les valeurs absentes et garde les nombres', () => {
    expect(csvCell(null)).toBe('');
    expect(csvCell(undefined)).toBe('');
    expect(csvCell(1500)).toBe('1500');
  });
  it('neutralise les formules mais garde les numéros de téléphone', () => {
    expect(csvCell('=SOMME(A1:A2)')).toBe("'=SOMME(A1:A2)");
    expect(csvCell('@cmd')).toBe("'@cmd");
    expect(csvCell('+cmd|calc')).toBe("'+cmd|calc");
    expect(csvCell('+261 34 12 345 67')).toBe('+261 34 12 345 67');
    expect(csvCell(-25)).toBe('-25');
  });
  it('produit un CSV avec BOM, en-têtes et séparateur point-virgule', () => {
    const csv = toCsv([{ n: 'Rakoto', m: 1000 }], [{ header: 'Nom', value: (r) => r.n }, { header: 'Montant', value: (r) => r.m }]);
    expect(csv).toBe('\uFEFFNom;Montant\r\nRakoto;1000\r\n');
  });
});
