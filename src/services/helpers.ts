export interface ListParams { page: number; pageSize: number; search?: string; sortKey?: string; ascending?: boolean }
export interface Paged<T> { rows: T[]; total: number }

export const rangeOf = ({ page, pageSize }: { page: number; pageSize: number }) => ({
  from: (page - 1) * pageSize,
  to: page * pageSize - 1,
});

/** Retire les caractères qui casseraient la syntaxe des filtres PostgREST (.or / ilike). */
export const cleanTerm = (s: string): string => s.trim().replace(/[%,()*\\]/g, ' ').trim();

/** Récupère toutes les pages d'une liste (export). Plafonné pour ne pas saturer le navigateur. */
export async function fetchAllPages<T>(
  load: (page: number, pageSize: number) => Promise<Paged<T>>,
  max = 5000,
): Promise<T[]> {
  const pageSize = 500;
  const all: T[] = [];
  for (let page = 1; all.length < max; page += 1) {
    const { rows, total } = await load(page, pageSize);
    all.push(...rows);
    if (rows.length < pageSize || all.length >= total) break;
  }
  return all.slice(0, max);
}
