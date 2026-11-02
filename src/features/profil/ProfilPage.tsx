import { useRef, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Users } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import Card, { InfoGrid } from '@/components/common/Card';
import StatusBadge from '@/components/common/StatusBadge';
import Field, { inputClass } from '@/components/forms/Field';
import { useAuth } from '@/features/auth/AuthContext';
import { useConfirm } from '@/hooks/useConfirm';
import { changePassword, updateOwnPhone } from '@/services/auth.service';
import { removeOwnAvatar, uploadOwnAvatar } from '@/services/avatar.service';
import { prepareAvatar } from '@/utils/image';
import { toFrenchMessage } from '@/utils/errors';
import { passwordStrength } from '@/utils/password';
import { formatDateTime } from '@/utils/format';
import { roleLabels, utilisateurMeta } from '@/utils/statuts';

const pwdSchema = z.object({
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Les mots de passe ne correspondent pas.' });
type PwdValues = z.infer<typeof pwdSchema>;

const btn = 'flex items-center gap-2 rounded-lg bg-omda-green px-4 py-2 text-sm font-medium text-white hover:bg-omda-greenDark disabled:opacity-60';

export default function ProfilPage() {
  const { profile, refreshProfile } = useAuth();
  const [phone, setPhone] = useState(profile?.telephone ?? '');
  const [savingPhone, setSavingPhone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const pwd = useForm<PwdValues>({ resolver: zodResolver(pwdSchema) });
  const [showPwd, setShowPwd] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const { confirm, dialog } = useConfirm();
  const strength = passwordStrength(pwd.watch('password') ?? '');

  if (!profile) return null;
  const forced = profile.statut === 'EN_ATTENTE_CHANGEMENT_MDP';

  const savePhone = async () => {
    setSavingPhone(true);
    try {
      await updateOwnPhone(profile.id, phone.trim() || null);
      await refreshProfile();
      toast.success('Téléphone mis à jour.');
    } catch (e) { toast.error(toFrenchMessage(e, 'La mise à jour du téléphone a échoué.')); }
    finally { setSavingPhone(false); }
  };

  const pickPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permet de rechoisir le même fichier
    if (!file) return;
    setUploading(true);
    try {
      await uploadOwnAvatar(profile.id, await prepareAvatar(file), profile.photo_path);
      await refreshProfile();
      toast.success('Photo de profil mise à jour.');
    } catch (err) { toast.error(toFrenchMessage(err, "L'envoi de la photo a échoué.")); }
    finally { setUploading(false); }
  };
  const removePhoto = async () => {
    if (!profile.photo_path) return;
    setUploading(true);
    try {
      await removeOwnAvatar(profile.id, profile.photo_path);
      await refreshProfile();
      toast.success('Photo supprimée.');
    } catch (err) { toast.error(toFrenchMessage(err, 'La suppression de la photo a échoué.')); }
    finally { setUploading(false); }
  };

  const applyPassword = async (v: PwdValues) => {
    setChangingPwd(true);
    try {
      await changePassword(profile.id, v.password);
      await refreshProfile();
      pwd.reset();
      toast.success('Mot de passe modifié.');
    } catch (e) { toast.error(toFrenchMessage(e, 'Le changement de mot de passe a échoué.')); }
    finally { setChangingPwd(false); }
  };
  const savePassword = pwd.handleSubmit((v) => confirm({ title: 'Changer le mot de passe', message: 'Voulez-vous vraiment changer votre mot de passe ?' }, () => void applyPassword(v)));

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Avatar path={profile.photo_path} label={profile.email} size="lg" />
          <div>
            <h1 className="text-2xl font-bold">Mon profil</h1>
            <p className="text-sm text-omda-textGray">{profile.email} – {roleLabels[profile.role]}</p>
          </div>
        </div>
        {profile.role === 'ADMINISTRATEUR' && (
          <Link to="/utilisateurs" className="inline-flex items-center gap-2 rounded-lg border border-omda-borderGray bg-white px-3 py-2 text-sm font-medium hover:bg-omda-warmGray">
            <Users className="h-4 w-4 text-omda-green" /> Gérer les comptes du personnel
          </Link>
        )}
      </div>
      {forced && <p className="rounded-lg bg-omda-ochre/15 px-4 py-3 text-sm text-omda-ochreDark">Pour des raisons de sécurité, vous devez changer votre mot de passe avant de continuer.</p>}

      <Card title="Photo de profil">
        <div className="flex flex-wrap items-center gap-4 p-4">
          <Avatar path={profile.photo_path} label={profile.email} size="xl" />
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} className={btn}>
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />} {profile.photo_path ? 'Changer la photo' : 'Ajouter une photo'}
              </button>
              {profile.photo_path && (
                <button type="button" disabled={uploading}
                  onClick={() => confirm({ title: 'Supprimer la photo', message: 'Voulez-vous retirer votre photo de profil ?' }, removePhoto)}
                  className="rounded-lg border border-omda-errorRed/40 px-4 py-2 text-sm font-medium text-omda-errorRed hover:bg-omda-errorRed/10 disabled:opacity-60">Supprimer</button>
              )}
            </div>
            <p className="text-xs text-omda-textGray">JPEG, PNG ou WebP. L'image est recadrée en carré.</p>
          </div>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pickPhoto} aria-label="Choisir une photo de profil" />
        </div>
      </Card>

      <Card title="Informations">
        <InfoGrid items={[
          ['Email', profile.email], ['Rôle', roleLabels[profile.role]],
          ['Statut', <StatusBadge {...utilisateurMeta[profile.statut]} />],
          ['Dernière connexion', formatDateTime(profile.derniere_connexion_at)],
        ]} />
        <div className="flex items-end gap-2 border-t border-omda-warmGray p-5">
          <div className="flex-1"><Field label="Téléphone"><input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field></div>
          <button onClick={() => confirm({ title: 'Enregistrer le téléphone', message: 'Voulez-vous enregistrer ce numéro de téléphone ?' }, savePhone)} disabled={savingPhone} className={btn}>{savingPhone && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer</button>
        </div>
      </Card>

      <Card title="Changer le mot de passe">
        <form onSubmit={savePassword} className="space-y-4 p-5" noValidate>
          <Field label="Nouveau mot de passe" error={pwd.formState.errors.password?.message}>
            <span className="relative block">
              <input type={showPwd ? 'text' : 'password'} autoComplete="new-password" className={`${inputClass} pr-11`} {...pwd.register('password')} />
              <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-omda-textGray hover:text-omda-black"
                aria-label={showPwd ? 'Masquer les mots de passe' : 'Afficher les mots de passe'}>
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
            {strength.score > 0 && (
              <span className="mt-2 flex items-center gap-2" aria-live="polite">
                <span className="flex flex-1 gap-1" aria-hidden>
                  {[1, 2, 3, 4].map((i) => (
                    <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength.score ? ['', 'bg-omda-errorRed', 'bg-omda-ochre', 'bg-omda-green', 'bg-omda-greenDark'][strength.score] : 'bg-omda-borderGray'}`} />
                  ))}
                </span>
                <span className="text-xs text-omda-textGray">{strength.label}</span>
              </span>
            )}
          </Field>
          <Field label="Confirmation" error={pwd.formState.errors.confirm?.message}>
            <input type={showPwd ? 'text' : 'password'} autoComplete="new-password" className={inputClass} {...pwd.register('confirm')} />
          </Field>
          <button type="submit" disabled={changingPwd} className={btn}>
            {changingPwd && <Loader2 className="h-4 w-4 animate-spin" />} Modifier le mot de passe
          </button>
        </form>
      </Card>
      {dialog}
    </div>
  );
}
