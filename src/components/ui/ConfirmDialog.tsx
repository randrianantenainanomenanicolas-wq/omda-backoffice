import { Loader2 } from 'lucide-react';
import Modal from './Modal';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', loading, danger, onConfirm, onCancel }: Props) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-omda-textGray">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-omda-borderGray px-4 py-2 text-sm hover:bg-omda-warmGray">{cancelLabel}</button>
        <button type="button" onClick={onConfirm} disabled={loading}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${danger ? 'bg-omda-errorRed hover:bg-omda-errorRed/90' : 'bg-omda-green hover:bg-omda-greenDark'}`}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
