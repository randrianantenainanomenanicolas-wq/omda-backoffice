import { Link, useNavigate, useParams } from 'react-router-dom';
import DangerZone from '@/components/common/DangerZone';
import { deletePaiement } from '@/services/delete.service';
import { ArrowLeft, Info } from 'lucide-react';
import Card, { InfoGrid } from '@/components/common/Card';
import { PageSkeleton } from '@/components/common/Skeleton';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable, { type Column } from '@/components/tables/DataTable';
import type { JournalPaiement } from '@/types/models';
import { formatDateTime, formatMontant } from '@/utils/format';
import { modePaiementLabels, operateurLabels, paiementMeta, typePaiementLabels } from '@/utils/statuts';
import { useJournal, usePaiement } from './hooks';
import { payeurDe } from './PaiementsPage';

export default function PaiementDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: p, isLoading, isError } = usePaiement(id);
  const journal = useJournal(id);

  if (isLoading) return <PageSkeleton />;
  if (isError) return <p className="text-sm text-omda-errorRed">Une erreur est survenue lors du chargement du paiement.</p>;
  if (!p) return <p className="text-sm text-omda-textGray">Paiement introuvable.</p>;

  const journalCols: Column<JournalPaiement>[] = [
    { key: 'date', header: 'Date', render: (j) => formatDateTime(j.created_at) },
    { key: 'evenement', header: 'Événement', render: (j) => <span className="font-medium">{j.evenement}</span> },
    { key: 'payload', header: 'Détails', render: (j) => <code className="text-xs text-omda-textGray">{j.payload ? JSON.stringify(j.payload).slice(0, 120) : '—'}</code> },
  ];
  const lien = (to: string, label: string) => <Link className="text-omda-green hover:underline" to={to}>{label}</Link>;

  return (
    <div className="space-y-4">
      <Link to="/paiements" className="inline-flex items-center gap-1 text-sm text-omda-textGray hover:text-omda-black"><ArrowLeft className="h-4 w-4" /> Paiements</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{p.reference_interne}</h1>
        <StatusBadge {...paiementMeta[p.statut]} />
      </div>

      <p className="flex items-start gap-2 rounded-lg bg-omda-infoBlueGray/10 px-4 py-3 text-sm text-omda-infoBlueGray">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        Les paiements Mobile Money (MVola) sont confirmés automatiquement par le serveur. Aucune action manuelle n'est possible depuis le Back Office.
      </p>
      {p.motif_echec && <p className="rounded-lg bg-omda-errorRed/10 px-4 py-3 text-sm text-omda-errorRed"><span className="font-medium">Motif :</span> {p.motif_echec}</p>}

      <Card title="Paiement">
        <InfoGrid items={[
          ['Type', typePaiementLabels[p.type]], ['Montant', formatMontant(p.montant, p.devise)],
          ['Mode', `${modePaiementLabels[p.mode]}${p.operateur ? ` (${operateurLabels[p.operateur]})` : ''}`],
          ['Téléphone', p.numero_telephone], ['Référence externe (opérateur)', p.reference_externe],
          ['Payeur', p.membre ? lien(`/membres/${p.membre.id}`, `${payeurDe(p)} (${p.membre.numero_adherent})`) : p.candidat ? lien(`/candidats/${p.candidat.id}`, payeurDe(p)) : '—'],
          ['Initié le', formatDateTime(p.date_initiation)], ['Confirmé par le serveur le', formatDateTime(p.date_confirmation)],
          ['Élément concerné',
            p.demande ? lien(`/demandes/${p.demande.id}`, `Demande ${p.demande.numero_dossier}`)
              : p.oeuvre ? lien(`/oeuvres/${p.oeuvre.id}`, `Œuvre « ${p.oeuvre.titre} »`)
              : '—'],
        ]} />
      </Card>

      <Card title="Journal du paiement">
        <DataTable columns={journalCols} rows={journal.data} getRowId={(j) => j.id} loading={journal.isLoading} error={journal.isError}
          errorMessage="Une erreur est survenue lors du chargement du journal." emptyMessage="Aucun événement enregistré." />
      </Card>
      {p.statut !== 'REUSSI' && (
        <DangerZone target={`le paiement ${p.reference_interne}`} confirmWord="SUPPRIMER"
          description="Supprime un paiement non abouti (initié, en attente, échoué ou rejeté). Un paiement réussi est une pièce comptable et ne se supprime jamais."
          onDelete={() => deletePaiement(p.id, p.statut)} onDone={() => navigate('/paiements')} />
      )}
    </div>
  );
}
