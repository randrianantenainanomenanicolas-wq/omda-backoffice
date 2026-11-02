import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import DeleteDialog from '@/components/ui/DeleteDialog';
import { useAuth } from '@/features/auth/AuthContext';
import { toFrenchMessage } from '@/utils/errors';

export interface DeleteActionProps {
  /** Désignation affichée dans la confirmation, ex. « le dossier OMDA-2026-0012 ». */
  target: string;
  onDelete: () => Promise<void>;
  /** Appelée après une suppression réussie (ex. retour à la liste). */
  onDone?: () => void;
  confirmWord?: string;
  /** Texte complémentaire sur les conséquences. */
  consequences?: string;
  variant?: 'button' | 'icon';
}

/** Bouton de suppression réservé aux administrateurs : invisible pour les autres rôles. La RLS reste l'autorité. */
export default function DeleteAction({ target, onDelete, onDone, confirmWord, consequences, variant = 'button' }: DeleteActionProps) {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const del = useMutation({ mutationFn: onDelete });

  if (profile?.role !== 'ADMINISTRATEUR') return null;

  const run = () => del.mutate(undefined, {
    onSuccess: () => {
      setOpen(false);
      toast.success('Suppression effectuée.');
      onDone?.();
      void qc.invalidateQueries();
    },
    onError: (e) => { setOpen(false); toast.error(toFrenchMessage(e, 'La suppression a échoué. Veuillez réessayer.')); },
  });

  return (
    <>
      {variant === 'icon' ? (
        <button type="button" onClick={() => setOpen(true)} title="Supprimer" aria-label={`Supprimer ${target}`}
          className="rounded p-1.5 text-omda-textGray hover:bg-omda-errorRed/10 hover:text-omda-errorRed"><Trash2 className="h-4 w-4" /></button>
      ) : (
        <button type="button" onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-omda-errorRed/40 bg-white px-3 py-2 text-sm font-medium text-omda-errorRed hover:bg-omda-errorRed/10">
          <Trash2 className="h-4 w-4" /> Supprimer
        </button>
      )}
      {open && (
        <DeleteDialog title="Confirmer la suppression" loading={del.isPending} confirmWord={confirmWord}
          message={`Vous allez supprimer ${target}.${consequences ? ` ${consequences}` : ''}`}
          onConfirm={run} onCancel={() => setOpen(false)} />
      )}
    </>
  );
}
