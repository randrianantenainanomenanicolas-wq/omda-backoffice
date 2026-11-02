import { Link, useNavigate, useParams } from 'react-router-dom';
import DangerZone from '@/components/common/DangerZone';
import { deleteMembre } from '@/services/delete.service';
import { ArrowLeft } from 'lucide-react';
import Card, { InfoGrid } from '@/components/common/Card';
import DemandesTable from '@/components/common/DemandesTable';
import { PageSkeleton } from '@/components/common/Skeleton';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable, { type Column } from '@/components/tables/DataTable';
import type { OeuvreResume, PaiementResume } from '@/types/models';
import { formatDate, formatDateTime, formatMontant } from '@/utils/format';
import {
  adhesionCategorieMeta, modePaiementLabels, oeuvreMeta, operateurLabels, paiementMeta, typePaiementLabels, utilisateurMeta,
} from '@/utils/statuts';
import { useMember, useMemberDossier } from './hooks';

export default function MembreDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: m, isLoading, isError } = useMember(id);
  const dossier = useMemberDossier(id);

  if (isLoading) return <PageSkeleton />;
  if (isError) return <p className="text-sm text-omda-errorRed">Une erreur est survenue lors du chargement du membre.</p>;
  if (!m) return <p className="text-sm text-omda-textGray">Membre introuvable.</p>;
  const c = m.candidat;
  const dossierError = dossier.isError;

  const oeuvreCols: Column<OeuvreResume>[] = [
    { key: 'titre', header: 'Titre', render: (o) => <span className="font-medium">{o.titre}</span> },
    { key: 'categorie', header: 'Catégorie', render: (o) => o.categorie?.libelle ?? '—' },
    { key: 'annee', header: 'Année', render: (o) => o.annee ?? '—' },
    { key: 'statut', header: 'Statut', render: (o) => <StatusBadge {...oeuvreMeta[o.statut]} /> },
  ];
  const paiementCols: Column<PaiementResume>[] = [
    { key: 'reference_interne', header: 'Référence', render: (p) => <span className="font-medium">{p.reference_interne}</span> },
    { key: 'type', header: 'Type', render: (p) => typePaiementLabels[p.type] },
    { key: 'mode', header: 'Mode', render: (p) => `${modePaiementLabels[p.mode]}${p.operateur ? ` (${operateurLabels[p.operateur]})` : ''}` },
    { key: 'montant', header: 'Montant', render: (p) => formatMontant(p.montant, p.devise) },
    { key: 'statut', header: 'Statut', render: (p) => <StatusBadge {...paiementMeta[p.statut]} /> },
    { key: 'date', header: 'Date', render: (p) => formatDateTime(p.date_initiation) },
  ];

  return (
    <div className="space-y-4">
      <Link to="/membres" className="inline-flex items-center gap-1 text-sm text-omda-textGray hover:text-omda-black"><ArrowLeft className="h-4 w-4" /> Membres</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{c ? `${c.prenom} ${c.nom}` : m.numero_adherent}</h1>
        <StatusBadge {...utilisateurMeta[m.statut]} />
      </div>

      <Card title="Identité et coordonnées">
        <InfoGrid items={[
          ['N° adhérent', m.numero_adherent], ['Date d\'inscription', formatDate(m.created_at)],
          ['CIN', c?.cin], ['Date de naissance', formatDate(c?.date_naissance)],
          ['Téléphone', c?.telephone], ['Email', c?.email], ['Adresse', c?.adresse],
          ['Fiche candidat', c ? <Link className="text-omda-green hover:underline" to={`/candidats/${c.id}`}>Consulter</Link> : '—'],
        ]} />
      </Card>

      <Card title="Catégories">
        <ul className="divide-y divide-omda-warmGray">
          {m.membre_categorie.length === 0 && <li className="p-5 text-sm text-omda-textGray">Aucune catégorie.</li>}
          {m.membre_categorie.map((mc) => (
            <li key={mc.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="font-medium">{mc.categorie?.libelle ?? '—'}</span>
              <span className="flex items-center gap-2 text-omda-textGray"><StatusBadge {...adhesionCategorieMeta[mc.statut]} /> {formatDate(mc.date_activation)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Demandes d'adhésion"><DemandesTable rows={dossier.data?.demandes} loading={dossier.isLoading} error={dossierError} /></Card>
      <Card title="Œuvres">
        <DataTable columns={oeuvreCols} rows={dossier.data?.oeuvres} getRowId={(o) => o.id} loading={dossier.isLoading} error={dossierError}
          errorMessage="Une erreur est survenue lors du chargement des œuvres." emptyMessage="Aucune œuvre."
          onRowClick={(o) => navigate(`/oeuvres/${o.id}`)} />
      </Card>
      <Card title="Paiements">
        <DataTable columns={paiementCols} rows={dossier.data?.paiements} getRowId={(p) => p.id} loading={dossier.isLoading} error={dossierError}
          errorMessage="Une erreur est survenue lors du chargement des paiements." emptyMessage="Aucun paiement."
          onRowClick={(p) => navigate(`/paiements/${p.id}`)} />
      </Card>
      <DangerZone target={`le membre ${m.numero_adherent}`} confirmWord="SUPPRIMER"
        description="Supprime la fiche membre. Impossible tant qu'il a des œuvres ou des paiements : pour retirer ses accès, désactivez plutôt son compte."
        onDelete={() => deleteMembre(m.id)} onDone={() => navigate('/membres')} />
    </div>
  );
}
