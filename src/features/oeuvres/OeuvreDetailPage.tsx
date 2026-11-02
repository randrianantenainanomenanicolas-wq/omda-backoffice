import { useState } from 'react';
import DangerZone from '@/components/common/DangerZone';
import { deleteOeuvre } from '@/services/delete.service';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Download, PlayCircle, XCircle } from 'lucide-react';
import Card, { InfoGrid } from '@/components/common/Card';
import { PageSkeleton } from '@/components/common/Skeleton';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable, { type Column } from '@/components/tables/DataTable';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/features/auth/AuthContext';
import { RejectDialog } from '@/features/demandes/DemandeActions';
import { getSignedUrl } from '@/services/oeuvre.service';
import type { Attestation, PaiementResume } from '@/types/models';
import { toFrenchMessage } from '@/utils/errors';
import { formatDate, formatDateTime, formatMontant, formatTaille } from '@/utils/format';
import { modePaiementLabels, oeuvreMeta, operateurLabels, paiementMeta, typePaiementLabels } from '@/utils/statuts';
import { auteurDe } from './OeuvresPage';
import { useAttestations, useOeuvre, useOeuvrePaiements, usePrendreEnCharge, useRejeterOeuvre, useValiderOeuvre } from './hooks';

export default function OeuvreDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [dialog, setDialog] = useState<'valider' | 'rejeter' | null>(null);

  const { data: o, isLoading, isError } = useOeuvre(id);
  const attestations = useAttestations(id);
  const paiements = useOeuvrePaiements(id);
  const prendre = usePrendreEnCharge();
  const valider = useValiderOeuvre();
  const rejeter = useRejeterOeuvre();

  if (isLoading) return <PageSkeleton />;
  if (isError) return <p className="text-sm text-omda-errorRed">Une erreur est survenue lors du chargement de l'œuvre.</p>;
  if (!o || !profile) return <p className="text-sm text-omda-textGray">Œuvre introuvable.</p>;

  const decidable = o.statut === 'ENVOYEE' || o.statut === 'EN_COURS_DE_VALIDATION';
  const open = async (path: string) => {
    try { window.open(await getSignedUrl('oeuvres', path), '_blank', 'noopener'); }
    catch (e) { toast.error(toFrenchMessage(e, "Impossible d'ouvrir ce fichier.")); }
  };
  const onError = (fallback: string) => (e: unknown) => toast.error(toFrenchMessage(e, fallback));
  const warn = (notified: boolean) => { if (!notified) toast.warning("La décision est enregistrée, mais la notification n'a pas pu être envoyée."); };

  const attCols: Column<Attestation>[] = [
    { key: 'mime', header: 'Fichier', render: (a) => a.mime_type },
    { key: 'taille', header: 'Taille', render: (a) => formatTaille(a.taille_octets) },
    { key: 'date', header: 'Ajoutée le', render: (a) => formatDateTime(a.created_at) },
    { key: 'actions', header: 'Action', render: (a) => <button onClick={() => open(a.chemin_stockage)} className="inline-flex items-center gap-1 text-omda-green hover:underline"><Download className="h-4 w-4" /> Consulter</button> },
  ];
  const payCols: Column<PaiementResume>[] = [
    { key: 'ref', header: 'Référence', render: (p) => <span className="font-medium">{p.reference_interne}</span> },
    { key: 'type', header: 'Type', render: (p) => typePaiementLabels[p.type] },
    { key: 'mode', header: 'Mode', render: (p) => `${modePaiementLabels[p.mode]}${p.operateur ? ` (${operateurLabels[p.operateur]})` : ''}` },
    { key: 'montant', header: 'Montant', render: (p) => formatMontant(p.montant, p.devise) },
    { key: 'statut', header: 'Statut', render: (p) => <StatusBadge {...paiementMeta[p.statut]} /> },
  ];

  return (
    <div className="space-y-4">
      <Link to="/oeuvres" className="inline-flex items-center gap-1 text-sm text-omda-textGray hover:text-omda-black"><ArrowLeft className="h-4 w-4" /> Œuvres</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{o.titre}</h1>
          <StatusBadge {...oeuvreMeta[o.statut]} />
        </div>
        {decidable && (
          <div className="flex flex-wrap gap-2">
            {o.statut === 'ENVOYEE' && (
              <button disabled={prendre.isPending}
                onClick={() => prendre.mutate({ id: o.id, agentId: profile.id }, { onSuccess: () => toast.success('Œuvre prise en charge.'), onError: onError('La prise en charge a échoué.') })}
                className="inline-flex items-center gap-2 rounded-lg border border-omda-borderGray px-3 py-2 text-sm hover:bg-omda-warmGray disabled:opacity-60">
                <PlayCircle className="h-4 w-4" /> Prendre en charge
              </button>
            )}
            <button onClick={() => setDialog('rejeter')} className="inline-flex items-center gap-2 rounded-lg bg-omda-errorRed px-3 py-2 text-sm font-medium text-white hover:bg-omda-errorRed/90"><XCircle className="h-4 w-4" /> Rejeter</button>
            <button onClick={() => setDialog('valider')} className="inline-flex items-center gap-2 rounded-lg bg-omda-green px-3 py-2 text-sm font-medium text-white hover:bg-omda-greenDark"><CheckCircle2 className="h-4 w-4" /> Valider</button>
          </div>
        )}
      </div>

      {o.statut === 'REJETEE' && o.motif_rejet && (
        <p className="rounded-lg bg-omda-errorRed/10 px-4 py-3 text-sm text-omda-errorRed"><span className="font-medium">Motif du rejet :</span> {o.motif_rejet}</p>
      )}

      <Card title="Œuvre">
        <InfoGrid items={[
          ['Auteur', auteurDe(o)], ['Catégorie', o.categorie?.libelle], ['Année', o.annee],
          ['Membre', o.membre ? <Link className="text-omda-green hover:underline" to={`/membres/${o.membre.id}`}>{o.membre.numero_adherent}</Link> : '—'],
          ['Demande d\'adhésion', o.demande ? <Link className="text-omda-green hover:underline" to={`/demandes/${o.demande.id}`}>{o.demande.numero_dossier}</Link> : '—'],
          ['Soumise le', formatDate(o.date_soumission)], ['Décision le', formatDate(o.date_decision)],
          ['Description', o.description],
          ['Fichier', o.chemin_fichier
            ? <button onClick={() => open(o.chemin_fichier!)} className="inline-flex items-center gap-1 text-omda-green hover:underline"><Download className="h-4 w-4" /> Consulter ({o.mime_type}{o.taille_octets ? `, ${formatTaille(o.taille_octets)}` : ''})</button>
            : 'Aucun fichier'],
        ]} />
      </Card>

      <Card title="Attestations de diffusion">
        <DataTable columns={attCols} rows={attestations.data} getRowId={(a) => a.id} loading={attestations.isLoading} error={attestations.isError}
          errorMessage="Une erreur est survenue lors du chargement des attestations." emptyMessage="Aucune attestation." />
      </Card>

      <Card title="Paiements liés à l'œuvre">
        <DataTable columns={payCols} rows={paiements.data} getRowId={(p) => p.id} loading={paiements.isLoading} error={paiements.isError}
          errorMessage="Une erreur est survenue lors du chargement des paiements." emptyMessage="Aucun paiement."
          onRowClick={(p) => navigate(`/paiements/${p.id}`)} />
      </Card>

      {dialog === 'rejeter' && (
        <RejectDialog title="Rejeter l'œuvre" saving={rejeter.isPending} onClose={() => setDialog(null)}
          onSubmit={(motif) => rejeter.mutate({ oeuvre: o, agentId: profile.id, motif }, {
            onSuccess: (r) => { toast.success('Œuvre rejetée.'); warn(r.notified); setDialog(null); },
            onError: onError("Le rejet de l'œuvre a échoué."),
          })} />
      )}
      {dialog === 'valider' && (
        <ConfirmDialog title="Valider l'œuvre" confirmLabel="Valider" loading={valider.isPending}
          message={`Confirmez-vous la validation de « ${o.titre} » ?`} onCancel={() => setDialog(null)}
          onConfirm={() => valider.mutate({ oeuvre: o, agentId: profile.id }, {
            onSuccess: (r) => { toast.success('Œuvre validée.'); warn(r.notified); setDialog(null); },
            onError: onError("La validation de l'œuvre a échoué."),
          })} />
      )}
      <DangerZone target={`l'œuvre « ${o.titre} »`} confirmWord="SUPPRIMER" consequences="Son fichier et ses attestations de diffusion seront aussi supprimés."
        description="Supprime l'œuvre, son fichier et ses attestations. Impossible une fois le dépôt finalisé ou si un paiement réussi y est lié."
        onDelete={() => deleteOeuvre(o.id)} onDone={() => navigate('/oeuvres')} />
    </div>
  );
}
