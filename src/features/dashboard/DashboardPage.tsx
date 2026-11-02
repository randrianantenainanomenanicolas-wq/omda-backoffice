import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  AlarmClock, ArrowRight, Bell, CalendarDays, CheckCircle2, Clock, CreditCard, FileCheck2, Layers, Music2,
  RefreshCw, UserSearch, Users, Wallet, type LucideIcon,
} from 'lucide-react';
import DonutCard from '@/components/charts/DonutCard';
import Card from '@/components/common/Card';
import KpiCard from '@/components/common/KpiCard';
import { ListSkeleton, Skeleton, StatCardSkeleton } from '@/components/common/Skeleton';
import StatusBadge from '@/components/common/StatusBadge';
import { useAuth } from '@/features/auth/AuthContext';
import { useDemandes } from '@/features/demandes/hooks';
import { getDashboardStats } from '@/services/dashboard.service';
import { countUnread } from '@/services/notification.service';
import { STATUTS_DEMANDE, STATUTS_OEUVRE, STATUTS_PAIEMENT } from '@/types/enums';
import { demandeColors, oeuvreColors, paiementColors, SERIE_DEMANDES, SERIE_OEUVRES } from '@/utils/chartColors';
import { formatDate, formatMontant } from '@/utils/format';
import { demandeMeta, oeuvreMeta, paiementMeta, roleLabels } from '@/utils/statuts';

// Icônes d'application : toutes les teintes viennent de la palette OMDA.
const TILE_COLORS = { green: 'bg-omda-green', forest: 'bg-omda-forest', ochre: 'bg-omda-ochreDark', blue: 'bg-omda-infoBlueGray' } as const;
interface Tile { to: string; label: string; icon: LucideIcon; color: keyof typeof TILE_COLORS; badge?: number }

function AppTile({ to, label, icon: Icon, color, badge = 0 }: Tile) {
  return (
    <Link to={to} className="group flex flex-col items-center gap-2 rounded-2xl p-2 text-center transition-colors hover:bg-omda-warmGray/70">
      <span className={`relative flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm transition-transform group-hover:-translate-y-0.5 group-active:scale-95 ${TILE_COLORS[color]}`}>
        <Icon className="h-6 w-6" />
        {badge > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-omda-ochre px-1 text-[11px] font-bold text-omda-black ring-2 ring-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      <span className="text-xs font-medium leading-tight sm:text-sm">{label}</span>
    </Link>
  );
}

function RecentDemandes() {
  const { data, isLoading, isError } = useDemandes({ page: 1, pageSize: 5 });
  return (
    <Card title="Dernières demandes" action={<Link to="/demandes" className="inline-flex items-center gap-1 text-sm font-medium text-omda-green hover:underline">Tout voir <ArrowRight className="h-4 w-4" /></Link>}>
      {isLoading ? <ListSkeleton rows={5} /> : isError ? (
        <p className="p-6 text-center text-sm text-omda-errorRed">Une erreur est survenue lors du chargement des demandes.</p>
      ) : !data || data.rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-omda-textGray">Aucune demande d'adhésion pour le moment.</p>
      ) : (
        <ul className="divide-y divide-omda-warmGray/80">
          {data.rows.map((d) => {
            const nom = d.candidat ? `${d.candidat.prenom} ${d.candidat.nom}` : d.numero_dossier;
            const initiales = d.candidat ? `${d.candidat.prenom.charAt(0)}${d.candidat.nom.charAt(0)}`.toUpperCase() : '#';
            return (
              <li key={d.id}>
                <Link to={`/demandes/${d.id}`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-omda-green/5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-omda-green/10 text-sm font-semibold text-omda-green">{initiales}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{nom}</span>
                    <span className="block truncate text-xs text-omda-textGray">{d.numero_dossier} – {formatDate(d.date_soumission)}</span>
                  </span>
                  <span className="shrink-0"><StatusBadge {...demandeMeta[d.statut]} /></span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Chargement du tableau de bord">
      <div className="space-y-2"><Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-72 max-w-full" /></div>
      <div className="rounded-2xl border border-omda-borderGray/80 bg-white p-4 shadow-card">
        <div className="grid grid-cols-4 gap-3 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => <div key={i} className="flex flex-col items-center gap-2 p-2"><Skeleton className="h-14 w-14 rounded-2xl" /><Skeleton className="h-3 w-12" /></div>)}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-56 rounded-xl" /><Skeleton className="h-56 rounded-xl lg:col-span-2" /></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}</div>
      <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-72 rounded-xl lg:col-span-2" /><Skeleton className="h-72 rounded-xl" /></div>
    </div>
  );
}

interface Tache { to: string; label: string; icon: LucideIcon; value: number; urgent?: boolean }

/** File de traitement : une ligne par type de travail, la barre indique le poids relatif. */
function FileTraitement({ taches }: { taches: Tache[] }) {
  const max = Math.max(1, ...taches.map((t) => t.value));
  return (
    <Card title="File de traitement">
      <ul className="divide-y divide-omda-warmGray/80">
        {taches.map(({ to, label, icon: Icon, value, urgent }) => {
          const color = urgent && value > 0 ? '#B3261E' : '#C79A3B';
          return (
            <li key={to + label}>
              <Link to={to} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-omda-green/5">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${urgent && value > 0 ? 'bg-omda-errorRed/10 text-omda-errorRed' : 'bg-omda-ochre/20 text-omda-ochreDark'}`}><Icon className="h-[18px] w-[18px]" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{label}</span>
                    <span className="text-lg font-bold tabular-nums">{value.toLocaleString('fr-FR')}</span>
                  </span>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-omda-warmGray" aria-hidden>
                    <span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${value === 0 ? 0 : Math.max(4, (value / max) * 100)}%`, backgroundColor: color }} />
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-omda-textGray transition-transform group-hover:translate-x-0.5 group-hover:text-omda-green" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/** Synthèse « à traiter » : un seul chiffre, l'alerte hors délai et l'accès direct aux demandes. */
function SyntheseTraitement({ total, horsDelai }: { total: number; horsDelai: number }) {
  return (
    <section className="flex flex-col justify-between rounded-xl bg-omda-forest p-5 text-white shadow-card" aria-label="Synthèse à traiter">
      <div>
        <p className="text-sm font-medium text-white/70">À traiter aujourd'hui</p>
        {total === 0 ? (
          <div className="mt-3 flex items-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-omda-ochre" aria-hidden />
            <p className="text-lg font-semibold leading-snug">Tout est à jour, rien en attente.</p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-6xl font-bold tabular-nums leading-none">{total.toLocaleString('fr-FR')}</p>
            <p className="mt-2 text-sm text-white/70">élément{total > 1 ? 's' : ''} en attente de décision</p>
          </>
        )}
      </div>
      <div className="mt-5 space-y-3">
        {horsDelai > 0 && (
          <p className="flex items-center gap-2 rounded-lg bg-omda-errorRed/90 px-3 py-2 text-sm font-medium">
            <AlarmClock className="h-4 w-4 shrink-0" aria-hidden />
            {horsDelai} dossier{horsDelai > 1 ? 's' : ''} hors délai (72 h)
          </p>
        )}
        <Link to="/demandes" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-omda-ochre px-4 py-2.5 text-sm font-semibold text-omda-black transition-colors hover:bg-omda-ochre/90">
          Traiter les demandes <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

const moisCourt = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
const moisLong = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

function Legende({ items }: { items: Array<{ label: string; color: string }> }) {
  return (
    <span className="flex items-center gap-3 text-xs text-omda-textGray">
      {items.map((i) => <span key={i.label} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: i.color }} aria-hidden />{i.label}</span>)}
    </span>
  );
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['dashboard', 'stats'], queryFn: getDashboardStats, refetchInterval: 60_000,
  });

  const { data: unread = 0 } = useQuery({
    queryKey: ['notifications', 'unread', profile?.id],
    queryFn: () => countUnread(profile!.id),
    enabled: !!profile,
  });

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) {
    return (
      <div className="rounded-xl border border-omda-errorRed/30 bg-omda-errorRed/10 p-6 text-sm text-omda-errorRed">
        Une erreur est survenue lors du chargement du tableau de bord.{' '}
        <button onClick={() => refetch()} className="font-medium underline">Réessayer</button>
      </div>
    );
  }

  const enAttente = data.demandes.ENVOYEE + data.demandes.EN_COURS_DE_VERIFICATION;
  const totalATraiter = enAttente + data.oeuvres.enAttente + data.categoriesEnAttente + data.paiements.enAttente;
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const maj = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

  const tiles: Tile[] = [
    { to: '/demandes', label: 'Demandes', icon: FileCheck2, color: 'forest', badge: enAttente },
    { to: '/oeuvres', label: 'Œuvres', icon: Music2, color: 'ochre', badge: data.oeuvres.enAttente },
    { to: '/paiements', label: 'Paiements', icon: CreditCard, color: 'green', badge: data.paiements.enAttente },
    { to: '/demandes-categorie', label: 'Catégories demandées', icon: Layers, color: 'forest', badge: data.categoriesEnAttente },
    { to: '/membres', label: 'Membres', icon: Users, color: 'green' },
    { to: '/candidats', label: 'Candidats', icon: UserSearch, color: 'blue' },
    { to: '/notifications', label: 'Notifications', icon: Bell, color: 'blue' },
  ];

  const taches: Tache[] = [
    { to: '/demandes', label: 'Dossiers hors délai (72 h)', icon: AlarmClock, value: data.horsDelai, urgent: true },
    { to: '/demandes', label: 'Demandes en attente', icon: Clock, value: enAttente },
    { to: '/oeuvres', label: 'Œuvres en attente', icon: FileCheck2, value: data.oeuvres.enAttente },
    { to: '/demandes-categorie', label: 'Catégories demandées', icon: Layers, value: data.categoriesEnAttente },
    { to: '/paiements', label: 'Paiements en attente', icon: CreditCard, value: data.paiements.enAttente },
    { to: '/notifications', label: 'Notifications non lues', icon: Bell, value: unread },
  ];

  const activite = data.activite.map((m) => ({ mois: moisCourt(m.debut), moisLong: moisLong(m.debut), Demandes: m.demandes, Œuvres: m.oeuvres }));
  const activiteVide = activite.every((m) => m.Demandes === 0 && m['Œuvres'] === 0);
  const nbMois = data.activite.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="mt-1 text-sm text-omda-textGray">Bonjour{profile ? `, ${roleLabels[profile.role].toLowerCase()}` : ''}. Voici l'état de l'activité et ce qui attend un traitement.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium capitalize text-omda-textGray shadow-card ring-1 ring-omda-borderGray/70">
            <CalendarDays className="h-4 w-4 text-omda-green" /> {today}
          </span>
          <button
            onClick={() => refetch()} disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-omda-textGray shadow-card ring-1 ring-omda-borderGray/70 transition-colors hover:text-omda-green disabled:opacity-70"
            aria-label="Actualiser les données"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> {maj ? `Mis à jour à ${maj}` : 'Actualiser'}
          </button>
        </div>
      </div>

      <nav aria-label="Accès rapide" className="rounded-2xl border border-omda-borderGray/80 bg-white p-3 shadow-card sm:p-4">
        <div className="grid grid-cols-4 gap-1 sm:gap-2 lg:grid-cols-7">
          {tiles.map((t) => <AppTile key={t.to} {...t} />)}
        </div>
      </nav>

      <section aria-labelledby="a-traiter" className="space-y-3">
        <h2 id="a-traiter" className="font-semibold">À traiter</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <SyntheseTraitement total={totalATraiter} horsDelai={data.horsDelai} />
          <div className="lg:col-span-2"><FileTraitement taches={taches} /></div>
        </div>
      </section>

      <section aria-labelledby="vue-ensemble" className="space-y-3">
        <h2 id="vue-ensemble" className="font-semibold">Vue d'ensemble</h2>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Membres" value={data.membres} icon={Users} to="/membres" />
          <KpiCard label="Candidats" value={data.candidats} icon={UserSearch} to="/candidats" />
          <KpiCard label="Œuvres déposées" value={data.oeuvres.total} icon={Music2} to="/oeuvres" />
          <KpiCard label={`Encaissé sur ${nbMois} mois`} value={formatMontant(data.encaissements.periode)} icon={Wallet} hint={`dont ${formatMontant(data.encaissements.moisEnCours)} ce mois-ci`} to="/paiements" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card title={`Activité des ${nbMois} derniers mois`} action={<Legende items={[{ label: 'Demandes', color: SERIE_DEMANDES }, { label: 'Œuvres', color: SERIE_OEUVRES }]} />}>
              {activiteVide ? (
                <p className="px-4 py-14 text-center text-sm text-omda-textGray">Aucune demande ni œuvre soumise sur cette période.</p>
              ) : (
                <div className="h-64 p-4 pb-2" role="img" aria-label={`Demandes et œuvres soumises par mois sur ${nbMois} mois`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activite} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E5DB" />
                      <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#6B675E' }} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6B675E' }} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(46,122,70,0.06)' }} labelFormatter={(_, p) => (p?.[0]?.payload?.moisLong as string) ?? ''} contentStyle={{ borderRadius: 8, border: '1px solid #DDD9CE', fontSize: 12 }} />
                      <Bar dataKey="Demandes" fill={SERIE_DEMANDES} radius={[5, 5, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="Œuvres" fill={SERIE_OEUVRES} radius={[5, 5, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
          <DonutCard
            title="Demandes par statut" unit="demandes" emptyText="Aucune demande d'adhésion pour le moment."
            action={<Link to="/demandes" className="text-sm font-medium text-omda-green hover:underline">Voir</Link>}
            slices={STATUTS_DEMANDE.map((s) => ({ key: s, label: demandeMeta[s].label, value: data.demandes[s], color: demandeColors[s] }))}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          <DonutCard
            title="Œuvres par statut" unit="œuvres" emptyText="Aucune œuvre déposée pour le moment."
            action={<Link to="/oeuvres" className="text-sm font-medium text-omda-green hover:underline">Voir</Link>}
            slices={STATUTS_OEUVRE.map((s) => ({ key: s, label: oeuvreMeta[s].label, value: data.oeuvres.parStatut[s], color: oeuvreColors[s] }))}
          />
          <DonutCard
            title="Paiements par statut" unit="paiements" emptyText="Aucun paiement enregistré pour le moment."
            action={<Link to="/paiements" className="text-sm font-medium text-omda-green hover:underline">Voir</Link>}
            slices={STATUTS_PAIEMENT.map((s) => ({ key: s, label: paiementMeta[s].label, value: data.paiements.parStatut[s], color: paiementColors[s] }))}
          />
          <div className="lg:col-span-2 2xl:col-span-1"><RecentDemandes /></div>
        </div>
      </section>
    </div>
  );
}
