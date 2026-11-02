import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, BookOpen, ClipboardCheck, CreditCard, Eye, EyeOff, FileDown, Loader2, Lock, Mail, Music2, ShieldCheck, Tags, Users,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from './AuthContext';
import HelpWidget from './HelpWidget';
import { toFrenchMessage } from '@/utils/errors';

const schema = z.object({
  email: z.string().min(1, "L'email est obligatoire.").email('Adresse email invalide.'),
  password: z.string().min(1, 'Le mot de passe est obligatoire.'),
});
type FormValues = z.infer<typeof schema>;

// Nos services : les rubriques du Back Office, sans commentaire.
const SERVICES: Array<{ icon: LucideIcon; title: string }> = [
  { icon: ClipboardCheck, title: 'Adhésions' },
  { icon: Music2, title: 'Œuvres' },
  { icon: CreditCard, title: 'Paiements' },
  { icon: Users, title: 'Membres' },
  { icon: Tags, title: 'Catégories et tarifs' },
  { icon: BookOpen, title: 'Documentation' },
  { icon: Bell, title: 'Notifications' },
  { icon: ShieldCheck, title: 'Comptes du personnel' },
];

export default function LoginPage() {
  const { session, profile, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  if (!loading && session && profile && profile.role !== 'MEMBRE') return <Navigate to={from} replace />;

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      await signIn(values.email, values.password);
      navigate(from, { replace: true });
    } catch (e) {
      setFormError(toFrenchMessage(e, 'Connexion impossible. Veuillez réessayer.'));
    }
  };

  // Les icônes sont posées dans le champ : `block` supprime l'espace de ligne sous l'input, le centrage vertical reste exact.
  const input = 'block w-full rounded-lg border border-omda-borderGray bg-white py-3 pl-10 pr-3 text-sm outline-none transition-shadow focus:border-omda-green focus:ring-2 focus:ring-omda-green/20 disabled:bg-omda-warmGray disabled:text-omda-textGray';
  const icon = 'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-omda-textGray';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-omda-forest p-4 sm:p-8">
      {/* Fond : halo vert + logo OMDA en filigrane, centré derrière le panneau. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(46,122,70,0.45),transparent_65%)]" />
      <img src="/omda-watermark.png" alt="" aria-hidden draggable={false}
        className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[min(120vmin,950px)] max-w-none -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.09]" />

      <main className="relative w-full max-w-md lg:max-w-5xl">
        <div className="grid overflow-hidden rounded-3xl shadow-2xl shadow-black/40 ring-1 ring-white/10 lg:grid-cols-[1.15fr_1fr]">
          {/* Nos services (grands écrans) */}
          <aside className="hidden flex-col justify-center gap-6 bg-white/[0.06] p-10 text-white lg:flex">
            <div className="flex items-center gap-4">
              <img src="/omda-logo.png" alt="OMDA" className="h-14 w-14 shrink-0 rounded-2xl bg-white p-1.5" />
              <div>
                <p className="text-2xl font-bold leading-tight">Office Malagasy des Droits d'Auteur</p>
                <p className="text-sm text-white/70">Back Office du personnel</p>
              </div>
            </div>

            <section aria-labelledby="services-titre">
              <h2 id="services-titre" className="mb-3 text-sm font-semibold text-white/80">Nos services</h2>
              <ul className="grid grid-cols-2 gap-3">
                {SERVICES.map(({ icon: Icon, title }) => (
                  <li key={title} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-omda-ochre"><Icon className="h-[18px] w-[18px]" /></span>
                    <span className="text-sm font-semibold leading-snug">{title}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="flex items-start gap-3 rounded-xl border border-omda-ochre/40 bg-omda-ochre/10 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-omda-ochre text-omda-black"><FileDown className="h-[18px] w-[18px]" /></span>
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  Exports CSV et PDF <span className="rounded-full bg-omda-ochre px-2 py-0.5 text-[10px] font-bold text-omda-black">Nouveau</span>
                </p>
                <p className="mt-0.5 text-xs text-white/70">Exportez vos listes de membres, demandes, œuvres et paiements.</p>
              </div>
            </div>
          </aside>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col justify-center bg-white p-7 sm:p-10 lg:p-12">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <img src="/omda-logo-transparent.png" alt="OMDA" className="h-16 w-16 lg:hidden" />
              <p className="mt-2 text-xs text-omda-textGray lg:hidden">Office Malagasy des Droits d'Auteur</p>
              <h1 className="mt-3 text-2xl font-bold lg:mt-0 lg:text-3xl">Connexion</h1>
            </div>

            <label className="mt-7 block text-sm font-medium">Email
              <span className="relative mt-1.5 block">
                <Mail className={icon} aria-hidden />
                <input type="email" autoComplete="username" disabled={isSubmitting} className={input} {...register('email')} />
              </span>
              {errors.email && <span className="mt-1 block text-xs font-normal text-omda-errorRed">{errors.email.message}</span>}
            </label>

            <label className="mt-5 block text-sm font-medium">Mot de passe
              <span className="relative mt-1.5 block">
                <Lock className={icon} aria-hidden />
                <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" disabled={isSubmitting} className={`${input} pr-11`} {...register('password')} />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-omda-textGray hover:text-omda-black"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
              {errors.password && <span className="mt-1 block text-xs font-normal text-omda-errorRed">{errors.password.message}</span>}
            </label>

            {formError && <p role="alert" className="mt-4 rounded-lg bg-omda-errorRed/10 px-3 py-2 text-sm text-omda-errorRed">{formError}</p>}

            <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}
              className="relative mt-7 flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-omda-green px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-omda-greenDark disabled:cursor-wait disabled:hover:bg-omda-green">
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Connexion en cours…</> : 'Se connecter'}
              {isSubmitting && <span className="absolute inset-x-0 bottom-0 h-[3px] overflow-hidden bg-white/20" aria-hidden><span className="block h-full w-1/4 animate-progress rounded-full bg-omda-ochre" /></span>}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-white/60">© {new Date().getFullYear()} Office Malagasy des Droits d'Auteur</p>
      </main>

      <HelpWidget />
    </div>
  );
}
