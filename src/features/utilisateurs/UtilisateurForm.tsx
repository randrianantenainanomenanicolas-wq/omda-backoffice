import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import Field, { inputClass } from '@/components/forms/Field';
import { ROLES, STATUTS_UTILISATEUR } from '@/types/enums';
import type { Utilisateur } from '@/types/models';
import type { UtilisateurInput } from '@/services/utilisateur.service';
import { roleLabels, utilisateurMeta } from '@/utils/statuts';

const schema = z.object({
  telephone: z.string().trim().nullable().transform((v) => (v ? v : null)),
  role: z.enum(ROLES),
  statut: z.enum(STATUTS_UTILISATEUR),
});

interface Props { user: Utilisateur; isSelf: boolean; saving: boolean; onSubmit: (v: UtilisateurInput) => void; onCancel: () => void }

export default function UtilisateurForm({ user, isSelf, saving, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<UtilisateurInput>({
    resolver: zodResolver(schema),
    defaultValues: { telephone: user.telephone ?? '', role: user.role, statut: user.statut },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Email (géré par Supabase Auth)"><input className={inputClass} value={user.email} disabled readOnly /></Field>
      <Field label="Téléphone" error={errors.telephone?.message}><input className={inputClass} {...register('telephone')} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Rôle" error={errors.role?.message}>
          <select className={inputClass} disabled={isSelf} {...register('role')}>
            {ROLES.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
          </select>
        </Field>
        <Field label="Statut" error={errors.statut?.message}>
          <select className={inputClass} disabled={isSelf} {...register('statut')}>
            {STATUTS_UTILISATEUR.map((s) => <option key={s} value={s}>{utilisateurMeta[s].label}</option>)}
          </select>
        </Field>
      </div>
      {isSelf && <p className="text-xs text-omda-textGray">Vous ne pouvez pas modifier votre propre rôle ni votre propre statut.</p>}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-omda-borderGray px-4 py-2 text-sm hover:bg-omda-warmGray">Annuler</button>
        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-omda-green px-4 py-2 text-sm font-medium text-white hover:bg-omda-greenDark disabled:opacity-60">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer
        </button>
      </div>
    </form>
  );
}
