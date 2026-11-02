import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import Modal from './Modal';

interface Props {
  title: string;
  message: string;
  /** Si défini, l'utilisateur doit le recopier pour activer le bouton (suppressions lourdes). */
  confirmWord?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteDialog({ title, message, confirmWord, loading, onConfirm, onCancel }: Props) {
  const [typed, setTyped] = useState('');
  const allowed = !confirmWord || typed.trim().toUpperCase() === confirmWord.toUpperCase();

  return (
    <Modal title={title} onClose={onCancel}>
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-omda-errorRed/10 text-omda-errorRed"><Trash2 className="h-5 w-5" /></span>
        <div className="space-y-2 text-sm">
          <p className="text-omda-textGray">{message}</p>
          <p className="font-medium text-omda-errorRed">Cette action est irréversible.</p>
        </div>
      </div>
      {confirmWord && (
        <label className="mt-4 block text-sm">
          Pour confirmer, saisissez <strong>{confirmWord}</strong>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off"
            className="mt-1.5 w-full rounded-lg border border-omda-borderGray px-3 py-2 text-sm outline-none focus:border-omda-errorRed focus:ring-2 focus:ring-omda-errorRed/20" />
        </label>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-omda-borderGray px-4 py-2 text-sm hover:bg-omda-warmGray">Non</button>
        <button type="button" onClick={onConfirm} disabled={!allowed || loading}
          className="flex items-center gap-2 rounded-lg bg-omda-errorRed px-4 py-2 text-sm font-medium text-white hover:bg-omda-errorRed/90 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Oui, supprimer
        </button>
      </div>
    </Modal>
  );
}
