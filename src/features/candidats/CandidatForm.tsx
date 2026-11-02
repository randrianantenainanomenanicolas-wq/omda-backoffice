import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import Field, { inputClass } from '@/components/forms/Field';
import { useConfirm } from '@/hooks/useConfirm';
import type { Candidat } from '@/types/models';
import type { CandidatInput } from '@/services/candidat.service';

// Miroir de candidat_age_min_chk (≥ 15 ans). La base reste l'autorité.
const maxBirthDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 15);
  return d.toISOString().slice(0, 10);
};

const schema = z.object({
  nom: z.string().trim().min(1, 'Le nom est obligatoire.'),
  prenom: z.string().trim().min(1, 'Le prénom est obligatoire.'),
  cin: z.string().trim().min(1, 'Le CIN est obligatoire.'),
  date_naissance: z.string().min(1, 'La date de naissance est obligatoire.')
    .refine((v) => v <= maxBirthDate(), 'Le candidat doit avoir au moins 15 ans.'),
  telephone: z.string().trim().min(1, 'Le téléphone est obligatoire.'),
  email: z.string().trim().min(1, "L'email est obligatoire.").email('Adresse email invalide.'),
  adresse: z.string().trim().min(1, "L'adresse est obligatoire."),
});

interface Props { candidat: Candidat; saving: boolean; onSubmit: (v: CandidatInput) => void; onCancel: () => void }

export default function CandidatForm({ candidat, saving, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<CandidatInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: candidat.nom, prenom: candidat.prenom, cin: candidat.cin, date_naissance: candidat.date_naissance,
      telephone: candidat.telephone, email: candidat.email, adresse: candidat.adresse,
    },
  });
  const { confirm, dialog } = useConfirm();
  const submit = handleSubmit((v) => confirm({ title: 'Enregistrer les modifications', message: 'Voulez-vous enregistrer les modifications de ce candidat ?' }, () => onSubmit(v)));

  return (
    <>
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" error={errors.nom?.message}><input className={inputClass} {...register('nom')} /></Field>
        <Field label="Prénom" error={errors.prenom?.message}><input className={inputClass} {...register('prenom')} /></Field>
        <Field label="CIN" error={errors.cin?.message}><input className={inputClass} {...register('cin')} /></Field>
        <Field label="Date de naissance" error={errors.date_naissance?.message}><input type="date" className={inputClass} {...register('date_naissance')} /></Field>
        <Field label="Téléphone" error={errors.telephone?.message}><input className={inputClass} {...register('telephone')} /></Field>
        <Field label="Email" error={errors.email?.message}><input type="email" className={inputClass} {...register('email')} /></Field>
      </div>
      <Field label="Adresse" error={errors.adresse?.message}><input className={inputClass} {...register('adresse')} /></Field>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-omda-borderGray px-4 py-2 text-sm hover:bg-omda-warmGray">Annuler</button>
        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-omda-green px-4 py-2 text-sm font-medium text-white hover:bg-omda-greenDark disabled:opacity-60">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer
        </button>
      </div>
    </form>
    {dialog}
    </>
  );
}
