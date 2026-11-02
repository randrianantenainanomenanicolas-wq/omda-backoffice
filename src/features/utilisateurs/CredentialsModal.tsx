import { useState } from 'react';
import { Check, Copy, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';

interface Props { title: string; email: string; password: string; onClose: () => void }

/** Affiche UNE SEULE FOIS le mot de passe temporaire : il n'est stocké nulle part ailleurs. */
export default function CredentialsModal({ title, email, password, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Email : ${email}\nMot de passe temporaire : ${password}`);
      setCopied(true);
      toast.success('Identifiants copiés.');
    } catch { toast.error('Copie impossible : sélectionnez le texte manuellement.'); }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        <dl className="space-y-3 rounded-lg bg-omda-warmGray p-4 text-sm">
          <div><dt className="text-xs font-medium text-omda-textGray">Email</dt><dd className="mt-0.5 font-medium">{email}</dd></div>
          <div>
            <dt className="text-xs font-medium text-omda-textGray">Mot de passe temporaire</dt>
            <dd className="mt-0.5 flex items-center gap-2"><KeyRound className="h-4 w-4 text-omda-ochreDark" /><code className="select-all rounded bg-white px-2 py-1 font-mono text-base">{password}</code></dd>
          </div>
        </dl>
        <p className="rounded-lg bg-omda-ochre/15 px-3 py-2 text-sm text-omda-ochreDark">
          Ce mot de passe ne sera plus affiché après la fermeture de cette fenêtre. Transmettez-le par un canal sûr : l'utilisateur devra le changer dès sa première connexion.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={copy} className="inline-flex items-center gap-2 rounded-lg border border-omda-borderGray px-4 py-2 text-sm hover:bg-omda-warmGray">
            {copied ? <Check className="h-4 w-4 text-omda-green" /> : <Copy className="h-4 w-4" />} {copied ? 'Copié' : 'Copier'}
          </button>
          <button onClick={onClose} className="rounded-lg bg-omda-green px-4 py-2 text-sm font-medium text-white hover:bg-omda-greenDark">Fermer</button>
        </div>
      </div>
    </Modal>
  );
}
