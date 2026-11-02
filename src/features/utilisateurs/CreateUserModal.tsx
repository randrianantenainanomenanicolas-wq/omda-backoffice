import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import Field, { inputClass } from '@/components/forms/Field';
import Modal from '@/components/ui/Modal';
import { createStaffUser, type CreatedUser } from '@/services/admin.service';
import { toFrenchMessage } from '@/utils/errors';

const schema = z.object({
  email: z.string().min(1, "L'email est obligatoire.").email('Adresse email invalide.'),
  role: z.enum(['AGENT', 'ADMINISTRATEUR']),
  telephone: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export default function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: CreatedUser) => void }) {
  const create = useMutation({ mutationFn: createStaffUser });
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { role: 'AGENT' } });

  const submit = handleSubmit((v) => create.mutate(
    { email: v.email.trim(), role: v.role, telephone: v.telephone?.trim() || null },
    {
      onSuccess: (created) => { toast.success('Compte créé.'); onCreated(created); },
      onError: (e) => toast.error(toFrenchMessage(e, 'La création du compte a échoué.')),
    },
  ));

  return (
    <Modal title="Ajouter un utilisateur" onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <p className="text-sm text-omda-textGray">Un mot de passe temporaire est généré. L'utilisateur devra le changer à sa première connexion.</p>
        <Field label="Email" error={errors.email?.message}>
          <input type="email" autoComplete="off" className={inputClass} {...register('email')} />
        </Field>
        <Field label="Rôle" error={errors.role?.message}>
          <select className={inputClass} {...register('role')}>
            <option value="AGENT">Agent : traite les demandes, œuvres et catégories</option>
            <option value="ADMINISTRATEUR">Administrateur : tous les droits, dont les comptes et les suppressions</option>
          </select>
        </Field>
        <Field label="Téléphone (facultatif)" error={errors.telephone?.message}>
          <input type="tel" autoComplete="off" className={inputClass} {...register('telephone')} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-omda-borderGray px-4 py-2 text-sm hover:bg-omda-warmGray">Annuler</button>
          <button type="submit" disabled={create.isPending} className="flex items-center gap-2 rounded-lg bg-omda-green px-4 py-2 text-sm font-medium text-white hover:bg-omda-greenDark disabled:opacity-60">
            {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Créer le compte
          </button>
        </div>
      </form>
    </Modal>
  );
}
