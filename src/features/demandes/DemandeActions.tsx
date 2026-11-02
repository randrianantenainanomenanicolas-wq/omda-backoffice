import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import Field, { inputClass } from '@/components/forms/Field';
import Modal from '@/components/ui/Modal';

const footer = 'flex justify-end gap-2 pt-2';
const cancelBtn = 'rounded-lg border border-omda-borderGray px-4 py-2 text-sm hover:bg-omda-warmGray';
const submitBtn = (color: string) => `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${color}`;

const rejectSchema = z.object({ motif: z.string().trim().min(1, 'Le motif de rejet est obligatoire.') });

export function RejectDialog({ title = 'Rejeter la demande', saving, onSubmit, onClose }: { title?: string; saving: boolean; onSubmit: (motif: string) => void; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<{ motif: string }>({ resolver: zodResolver(rejectSchema) });
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit((v) => onSubmit(v.motif))} className="space-y-4" noValidate>
        <Field label="Motif du rejet (obligatoire)" error={errors.motif?.message}>
          <textarea rows={4} className={inputClass} {...register('motif')} />
        </Field>
        <div className={footer}>
          <button type="button" onClick={onClose} className={cancelBtn}>Annuler</button>
          <button type="submit" disabled={saving} className={submitBtn('bg-omda-errorRed hover:bg-omda-errorRed/90')}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Rejeter
          </button>
        </div>
      </form>
    </Modal>
  );
}
