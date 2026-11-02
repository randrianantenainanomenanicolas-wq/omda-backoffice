import { supabase } from '@/lib/supabase';

export type Row = Record<string, unknown>;

export async function listResource(table: string, select: string, orderBy: { column: string; ascending?: boolean }): Promise<Row[]> {
  const { data, error } = await supabase.from(table).select(select).order(orderBy.column, { ascending: orderBy.ascending ?? true });
  if (error) throw error;
  return (data ?? []) as unknown as Row[];
}

export async function createResource(table: string, payload: Row): Promise<void> {
  const { error } = await supabase.from(table).insert(payload);
  if (error) throw error;
}

// Toutes les tables de référence du schéma ont une colonne updated_at sans trigger : renseignée ici.
export async function updateResource(table: string, idColumn: string, id: unknown, payload: Row): Promise<void> {
  const { error } = await supabase.from(table).update({ ...payload, updated_at: new Date().toISOString() }).eq(idColumn, id as string);
  if (error) throw error;
}
