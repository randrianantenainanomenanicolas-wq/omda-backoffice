import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { useConfirm } from '@/hooks/useConfirm';
import Field, { inputClass } from './Field';

export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: string | number | boolean;
  disabledOnEdit?: boolean;
  min?: number;
  minLength?: number;
  maxLength?: number;
  rows?: number;
  wide?: boolean;
}

type Values = Record<string, unknown>;
type FormValues = Record<string, string | boolean>;

const initialOf = (f: FieldDef, v: unknown): string | boolean => {
  const raw = v === undefined ? f.defaultValue : v;
  if (f.type === 'checkbox') return Boolean(raw ?? false);
  return raw === null || raw === undefined ? '' : String(raw);
};

function convert(fields: FieldDef[], raw: FormValues): Values {
  const out: Values = {};
  for (const f of fields) {
    const v = raw[f.name];
    if (f.type === 'checkbox') out[f.name] = Boolean(v);
    else if (f.type === 'number') out[f.name] = v === '' || v === undefined ? null : Number(v);
    else out[f.name] = typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
  }
  return out;
}

interface Props {
  fields: FieldDef[];
  initial?: Values;          // présent = édition
  saving: boolean;
  onSubmit: (values: Values) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export default function EntityForm({ fields, initial, saving, onSubmit, onCancel, submitLabel = 'Enregistrer' }: Props) {
  const isEdit = !!initial;
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: Object.fromEntries(fields.map((f) => [f.name, initialOf(f, initial?.[f.name])])),
  });

  const { confirm, dialog } = useConfirm();
  const submit = handleSubmit((raw) => {
    const values = convert(fields, raw);
    if (isEdit) confirm({ title: 'Enregistrer les modifications', message: 'Voulez-vous enregistrer les modifications ?' }, () => onSubmit(values));
    else onSubmit(values);
  });

  return (
    <>
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const disabled = isEdit && f.disabledOnEdit;
          const err = errors[f.name]?.message as string | undefined;
          const opts = {
            required: f.required ? `${f.label} : champ obligatoire.` : false,
            ...(f.min !== undefined && { min: { value: f.min, message: `${f.label} : valeur minimale ${f.min}.` } }),
            ...(f.minLength !== undefined && { minLength: { value: f.minLength, message: `${f.label} : ${f.minLength} caractères exactement.` } }),
            ...(f.maxLength !== undefined && { maxLength: { value: f.maxLength, message: `${f.label} : ${f.maxLength} caractères maximum.` } }),
          };
          const span = f.wide || f.type === 'textarea' ? 'sm:col-span-2' : '';
          if (f.type === 'checkbox') {
            return (
              <label key={f.name} className={`flex items-center gap-2 text-sm font-medium ${span}`}>
                <input type="checkbox" className="h-4 w-4 rounded border-omda-borderGray" {...register(f.name)} /> {f.label}
              </label>
            );
          }
          return (
            <div key={f.name} className={span}>
              <Field label={f.label} error={err}>
                {f.type === 'textarea' ? (
                  <textarea rows={f.rows ?? 4} className={inputClass} {...register(f.name, opts)} />
                ) : f.type === 'select' ? (
                  <select className={inputClass} disabled={disabled} {...register(f.name, opts)}>
                    {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input type={f.type} step={f.type === 'number' ? 'any' : undefined} className={inputClass} disabled={disabled} {...register(f.name, opts)} />
                )}
              </Field>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-omda-borderGray px-4 py-2 text-sm hover:bg-omda-warmGray">Annuler</button>
        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-omda-green px-4 py-2 text-sm font-medium text-white hover:bg-omda-greenDark disabled:opacity-60">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} {submitLabel}
        </button>
      </div>
    </form>
    {dialog}
    </>
  );
}
