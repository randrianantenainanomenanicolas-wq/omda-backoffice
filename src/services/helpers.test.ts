import { describe, expect, it } from 'vitest';
import { cleanTerm, fetchAllPages, rangeOf } from './helpers';

describe('helpers', () => {
  it('calcule la plage de pagination', () => {
    expect(rangeOf({ page: 1, pageSize: 15 })).toEqual({ from: 0, to: 14 });
    expect(rangeOf({ page: 3, pageSize: 10 })).toEqual({ from: 20, to: 29 });
  });
  it('neutralise les caractères qui cassent les filtres PostgREST', () => {
    expect(cleanTerm('  a,b(c)%*  ')).toBe('a b c');
  });
});

describe('fetchAllPages', () => {
  const source = Array.from({ length: 1200 }, (_, i) => i);
  const load = async (page: number, pageSize: number) => ({ rows: source.slice((page - 1) * pageSize, page * pageSize), total: source.length });

  it('rassemble toutes les pages', async () => {
    expect(await fetchAllPages(load)).toHaveLength(1200);
  });
  it('respecte le plafond', async () => {
    expect(await fetchAllPages(load, 700)).toHaveLength(700);
  });
  it('gère une liste vide', async () => {
    expect(await fetchAllPages(async () => ({ rows: [], total: 0 }))).toEqual([]);
  });
});
