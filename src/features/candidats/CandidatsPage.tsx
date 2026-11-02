import { useNavigate } from 'react-router-dom';
import Card from '@/components/common/Card';
import DataTable, { type Column } from '@/components/tables/DataTable';
import Pagination from '@/components/tables/Pagination';
import SearchInput from '@/components/tables/SearchInput';
import ExportButton from '@/components/tables/ExportButton';
import { useListState } from '@/hooks/useListState';
import { listCandidats } from '@/services/candidat.service';
import { fetchAllPages } from '@/services/helpers';
import type { CsvColumn } from '@/utils/csv';
import type { Candidat } from '@/types/models';
import { formatDate } from '@/utils/format';
import { useCandidates } from './hooks';

export default function CandidatsPage() {
  const navigate = useNavigate();
  const ls = useListState({ sortKey: 'created_at' });
  const { data, isLoading, isError, refetch } = useCandidates({
    page: ls.page, pageSize: ls.pageSize, search: ls.search, sortKey: ls.sort.key, ascending: ls.sort.ascending,
  });

  const columns: Column<Candidat>[] = [
    { key: 'nom', header: 'Nom', sortable: true, render: (c) => <span className="font-medium">{c.nom}</span> },
    { key: 'prenom', header: 'Prénom', sortable: true, render: (c) => c.prenom },
    { key: 'cin', header: 'CIN', render: (c) => c.cin },
    { key: 'telephone', header: 'Téléphone', render: (c) => c.telephone },
    { key: 'email', header: 'Email', render: (c) => c.email },
    { key: 'created_at', header: 'Créé le', sortable: true, render: (c) => formatDate(c.created_at) },
  ];

  const exportColumns: CsvColumn<Candidat>[] = [
    { header: 'Nom', value: (c) => c.nom }, { header: 'Prénom', value: (c) => c.prenom },
    { header: 'CIN', value: (c) => c.cin }, { header: 'Date de naissance', value: (c) => formatDate(c.date_naissance) },
    { header: 'Téléphone', value: (c) => c.telephone }, { header: 'Email', value: (c) => c.email },
    { header: 'Adresse', value: (c) => c.adresse }, { header: 'Créé le', value: (c) => formatDate(c.created_at) },
  ];
  const fetchAll = () => fetchAllPages((page, pageSize) => listCandidats({
    page, pageSize, search: ls.search, sortKey: ls.sort.key, ascending: ls.sort.ascending,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Candidats</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButton filename="candidats" title="Liste des candidats" columns={exportColumns} fetchAll={fetchAll} disabled={!data?.total} />
          <SearchInput onChange={ls.setSearch} placeholder="Nom, CIN, email, téléphone…" />
        </div>
      </div>
      <Card>
        <DataTable columns={columns} rows={data?.rows} getRowId={(c) => c.id} loading={isLoading} error={isError}
          errorMessage="Une erreur est survenue lors du chargement des candidats." onRetry={() => refetch()}
          emptyMessage="Aucun candidat trouvé." sort={ls.sort} onSort={ls.toggleSort}
          onRowClick={(c) => navigate(`/candidats/${c.id}`)} />
        <Pagination page={ls.page} pageSize={ls.pageSize} total={data?.total ?? 0} onPage={ls.setPage} />
      </Card>
    </div>
  );
}
