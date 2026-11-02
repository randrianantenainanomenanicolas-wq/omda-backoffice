import { useCallback, useState, type ReactNode } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface Request { title: string; message: string; danger?: boolean; run: () => void }

/**
 * Confirmation « Oui / Non » avant une action.
 *   const { confirm, dialog } = useConfirm();
 *   confirm({ title: '…', message: '…' }, () => faireLAction());
 *   return (<>…{dialog}</>);
 * `dialog` se place HORS de tout <form> : ses boutons ne doivent pas soumettre le formulaire.
 */
export function useConfirm(): {
  confirm: (opts: Omit<Request, 'run'>, run: () => void) => void;
  dialog: ReactNode;
} {
  const [req, setReq] = useState<Request | null>(null);
  const confirm = useCallback((opts: Omit<Request, 'run'>, run: () => void) => setReq({ ...opts, run }), []);
  const dialog = req ? (
    <ConfirmDialog title={req.title} message={req.message} danger={req.danger} confirmLabel="Oui" cancelLabel="Non"
      onCancel={() => setReq(null)}
      onConfirm={() => { const { run } = req; setReq(null); run(); }} />
  ) : null;
  return { confirm, dialog };
}
