import { describe, expect, it } from 'vitest';
import { formatDate, formatMontant, formatTaille } from './format';

describe('format', () => {
  it('gère les dates absentes', () => { expect(formatDate(null)).toBe('—'); });
  it('formate un montant avec sa devise', () => { expect(formatMontant(1500, 'MGA')).toMatch(/1\D?500 MGA/); });
  it('formate les tailles de fichier', () => {
    expect(formatTaille(2048)).toBe('2 Ko');
    expect(formatTaille(3 * 1_048_576)).toBe('3.0 Mo');
  });
});
