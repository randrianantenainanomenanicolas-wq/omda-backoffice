import { useNavigate } from 'react-router-dom';
import DataTable, { type Column } from '@/components/tables/DataTable';
import StatusBadge from './StatusBadge';
import type { DemandeResume } from '@/types/models';
import { demandeMeta } from '@/utils/statuts';
import { formatDate } from '@/utils/format';

export default function DemandesTable({ rows, loading, error }: { rows?: DemandeResume[]; loading?: boolean; error?: boolean }) {
  const navigate = useNavigate();
  const columns: Column<DemandeResume>[] = [
    { key: 'numero_dossier', header: 'N° dossier', render: (d) => <span className="font-medium">{d.numero_dossier}</span> },
    { key: 'categorie', header: 'Catégorie', render: (d) => d.categorie?.libelle ?? '—' },
    { key: 'statut', header: 'Statut', render: (d) => <StatusBadge {...demandeMeta[d.statut]} /> },
    { key: 'date_soumission', header: 'Soumise le', render: (d) => formatDate(d.date_soumission) },
  ];
  return (
    <DataTable columns={columns} rows={rows} getRowId={(d) => d.id} loading={loading} error={error}
      errorMessage="Une erreur est survenue lors du chargement des demandes." emptyMessage="Aucune demande d'adhésion."
      onRowClick={(d) => navigate(`/demandes/${d.id}`)} />
  );
}
