import { supabase } from '@/lib/supabase';
import type { CategorieRef } from '@/types/models';

export async function listCategories(): Promise<CategorieRef[]> {
  const { data, error } = await supabase.from('categorie').select('id, libelle').order('libelle');
  if (error) throw error;
  return (data ?? []) as CategorieRef[];
}
