import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCheck, Megaphone } from 'lucide-react';
import Card from '@/components/common/Card';
import { ListSkeleton } from '@/components/common/Skeleton';
import EntityForm, { type FieldDef } from '@/components/forms/EntityForm';
import Pagination from '@/components/tables/Pagination';
import DeleteAction from '@/components/common/DeleteAction';
import Modal from '@/components/ui/Modal';
import { deleteNotification } from '@/services/delete.service';
import { useAuth } from '@/features/auth/AuthContext';
import { listNotifications, markAllAsRead, markAsRead, sendGlobalNotification } from '@/services/notification.service';
import { toFrenchMessage } from '@/utils/errors';
import { formatDateTime } from '@/utils/format';

const PAGE_SIZE = 20;
const FIELDS: FieldDef[] = [
  { name: 'titre', label: 'Titre', type: 'text', required: true, wide: true },
  { name: 'message', label: 'Message', type: 'textarea', required: true, rows: 5 },
];

export default function NotificationsPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [composing, setComposing] = useState(false);
  const isAdmin = profile?.role === 'ADMINISTRATEUR';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications', 'list', profile?.id, page],
    queryFn: () => listNotifications(profile!.id, page, PAGE_SIZE),
    enabled: !!profile, placeholderData: keepPreviousData,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ['notifications'] });
  const read = useMutation({ mutationFn: markAsRead, onSuccess: refresh, onError: (e) => toast.error(toFrenchMessage(e, 'Action impossible.')) });
  const readAll = useMutation({ mutationFn: () => markAllAsRead(profile!.id), onSuccess: refresh, onError: (e) => toast.error(toFrenchMessage(e, 'Action impossible.')) });
  const send = useMutation({ mutationFn: (v: { titre: string; message: string }) => sendGlobalNotification(v.titre, v.message), onSuccess: refresh });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <div className="flex gap-2">
          <button onClick={() => readAll.mutate()} disabled={readAll.isPending} className="inline-flex items-center gap-2 rounded-lg border border-omda-borderGray px-3 py-2 text-sm hover:bg-omda-warmGray disabled:opacity-60"><CheckCheck className="h-4 w-4" /> Tout marquer comme lu</button>
          {isAdmin && <button onClick={() => setComposing(true)} className="inline-flex items-center gap-2 rounded-lg bg-omda-green px-3 py-2 text-sm font-medium text-white hover:bg-omda-greenDark"><Megaphone className="h-4 w-4" /> Notification globale</button>}
        </div>
      </div>

      <Card>
        {isLoading && <ListSkeleton rows={4} />}
        {isError && <p className="p-6 text-center text-sm text-omda-errorRed">Une erreur est survenue lors du chargement des notifications. <button onClick={() => refetch()} className="font-medium underline">Réessayer</button></p>}
        {data?.rows.length === 0 && <p className="py-10 text-center text-sm text-omda-textGray">Aucune notification.</p>}
        <ul className="divide-y divide-omda-warmGray">
          {data?.rows.map((n) => {
            const own = n.utilisateur_id === profile?.id;
            return (
              <li key={n.id} className={`flex items-start justify-between gap-4 px-5 py-4 ${n.lue || !own ? '' : 'bg-omda-green/5'}`}>
                <div>
                  <p className="text-sm font-medium">
                    {!n.lue && own && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-omda-green" aria-label="Non lue" />}
                    {n.titre}{n.globale && <span className="ml-2 rounded bg-omda-warmGray px-1.5 py-0.5 text-xs font-normal text-omda-textGray">Globale</span>}
                  </p>
                  <p className="mt-1 text-sm text-omda-textGray">{n.message}</p>
                  <p className="mt-1 text-xs text-omda-textGray">{formatDateTime(n.date_envoi)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!n.lue && own && <button onClick={() => read.mutate(n.id)} className="text-xs text-omda-green hover:underline">Marquer comme lue</button>}
                  <DeleteAction variant="icon" target="cette notification" onDelete={() => deleteNotification(n.id)} />
                </div>
              </li>
            );
          })}
        </ul>
        <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPage={setPage} />
      </Card>

      {composing && (
        <Modal title="Envoyer une notification globale" onClose={() => setComposing(false)}>
          <EntityForm fields={FIELDS} saving={send.isPending} submitLabel="Envoyer" onCancel={() => setComposing(false)}
            onSubmit={(v) => send.mutate({ titre: String(v.titre), message: String(v.message) }, {
              onSuccess: () => { toast.success('Notification globale envoyée.'); setComposing(false); },
              onError: (e) => toast.error(toFrenchMessage(e, "L'envoi a échoué (droits d'insertion requis).")),
            })} />
        </Modal>
      )}
    </div>
  );
}
