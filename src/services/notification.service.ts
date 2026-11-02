import { supabase } from '@/lib/supabase';

/** Nombre de notifications non lues de l'utilisateur connecté (filtre explicite : le staff voit tout via RLS). */
export async function countUnread(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notification')
    .select('*', { count: 'exact', head: true })
    .eq('utilisateur_id', userId)
    .eq('lue', false);
  if (error) throw error;
  return count ?? 0;
}

import type { TypeNotification } from '@/types/enums';

export interface NewNotification {
  utilisateur_id: string | null;
  candidat_id: string | null;
  type: TypeNotification;
  titre: string;
  message: string;
}

/** Insertion « au mieux » : retourne false si la RLS ou la base la refuse (ne bloque jamais l'action métier). */
export async function tryCreateNotification(n: NewNotification): Promise<boolean> {
  const { error } = await supabase.from('notification').insert({ ...n, globale: false });
  return !error;
}

import type { NotificationRow } from '@/types/models';
import { rangeOf, type Paged } from './helpers';

/** Notifications de l'utilisateur connecté + notifications globales. */
export async function listNotifications(userId: string, page: number, pageSize: number): Promise<Paged<NotificationRow>> {
  const { from, to } = rangeOf({ page, pageSize });
  const { data, count, error } = await supabase
    .from('notification')
    .select('id, utilisateur_id, type, titre, message, lue, globale, date_envoi', { count: 'exact' })
    .or(`utilisateur_id.eq.${userId},globale.eq.true`)
    .order('date_envoi', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { rows: (data ?? []) as NotificationRow[], total: count ?? 0 };
}

export async function markAsRead(id: string): Promise<void> {
  const { error } = await supabase.from('notification').update({ lue: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase.from('notification').update({ lue: true }).eq('utilisateur_id', userId).eq('lue', false);
  if (error) throw error;
}

export async function sendGlobalNotification(titre: string, message: string): Promise<void> {
  const { error } = await supabase.from('notification').insert({ type: 'GLOBALE', titre, message, globale: true });
  if (error) throw error;
}
