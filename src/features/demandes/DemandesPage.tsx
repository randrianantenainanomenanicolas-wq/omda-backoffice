import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/common/Card';
import StatusBadge from '@/components/common/StatusBadge';
import { inputClass } from '@/components/forms/Field';
import DataTable, { type Column } from '@/components/tables/DataTable';
import Pagination from '@/components/tables/Pagination';
import SearchInput from '@/components/tables/SearchInput';
import { useCategories } from '@/features/membres/hooks';
import ExportButton from '@/components/tables/ExportButton';
import { useListState } from '@/hooks/useListState';
import { listDemandes } from '@/services/demande.service';
import { fetchAllPages } from '@/services/helpers';
import type { CsvColumn } from '@/utils/csv';
import { STATUTS_DEMANDE, type StatutDemande } from '@/types/enums';
import type { DemandeRow } from '@/types/models';
import { estHorsDelai } from '@/utils/dossier';
import { formatDate } from '@/utils/format';
import { demandeMeta } from '@/utils/statuts';
import { useDemandes } from './hooks';

export default function DemandesPage() {
  const navigate = useNavigate();
  const ls = useListState({ sortKey: 'created_at' });
  const [statut, setStatut] = useState<StatutDemande | ''>('');
  const [categorieId, setCategorieId] = useState('');
  const categories = useCategories();

  const { data, isLoading, isError, refetch } = useDemandes({
    page: ls.page, pageSize: ls.pageSize, search: ls.search, sortKey: ls.sort.key, ascending: ls.sort.ascending,
    statut: statut || undefined, categorieId: categorieId || undefined,
  });

  const columns: Column<DemandeRow>[] = [
    { key: 'numero_dossier', header: 'N° dossier', sortable: true, render: (d) => <span className="font-medium">{d.numero_dossier}</span> },
    { key: 'candidat', header: 'Candidat', render: (d) => (d.candidat ? `${d.candidat.prenom} ${d.candidat.nom}` : '—') },
    { key: 'categorie', header: 'Catégorie', render: (d) => d.categorie?.libelle ?? '—' },
    { key: 'statut', header: 'Statut', sortable: true, render: (d) => (
      <span className="inline-flex flex-wrap items-center gap-1">
        <StatusBadge {...demandeMeta[d.statut]} />
        {estHorsDelai(d.statut, d.date_soumission) && <StatusBadge label="Hors délai 72 h" tone="amber" />}
      </span>
    ) },
    { key: 'date_soumission', header: 'Soumise le', sortable: true, render: (d) => formatDate(d.date_soumission) },
    { key: 'created_at', header: 'Créée le', sortable: true, render: (d) => formatDate(d.created_at) },
  ];

  const exportColumns: CsvColumn<DemandeRow>[] = [
    { header: 'N° dossier', value: (d) => d.numero_dossier },
    { header: 'Nom', value: (d) => d.candidat?.nom },
    { header: 'Prénom', value: (d) => d.candidat?.prenom },
    { header: 'CIN', value: (d) => d.candidat?.cin },
    { header: 'Catégorie', value: (d) => d.categorie?.libelle },
    { header: 'Statut', value: (d) => demandeMeta[d.statut].label },
    { header: 'Hors délai 72 h', value: (d) => (estHorsDelai(d.statut, d.date_soumission) ? 'Oui' : 'Non') },
    { header: 'Soumise le', value: (d) => formatDate(d.date_soumission) },
    { header: 'Créée le', value: (d) => formatDate(d.created_at) },
  ];
  const fetchAll = () => fetchAllPages((page, pageSize) => listDemandes({
    page, pageSize, search: ls.search, sortKey: ls.sort.key, ascending: ls.sort.ascending,
    statut: statut || undefined, categorieId: categorieId || undefined,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Demandes d'adhésion</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select className={`${inputClass} !mt-0 w-auto`} value={statut} onChange={(e) => { setStatut(e.target.value as StatutDemande | ''); ls.resetPage(); }} aria-label="Filtrer par statut">
            <option value="">Tous les statuts</option>
            {STATUTS_DEMANDE.map((s) => <option key={s} value={s}>{demandeMeta[s].label}</option>)}
          </select>
          <select className={`${inputClass} !mt-0 w-auto`} value={categorieId} onChange={(e) => { setCategorieId(e.target.value); ls.resetPage(); }} aria-label="Filtrer par catégorie">
            <option value="">Toutes les catégories</option>
            {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
          </select>
          <ExportButton filename="demandes" title="Demandes d'adhésion" columns={exportColumns} fetchAll={fetchAll} disabled={!data?.total} />
          <SearchInput onChange={ls.setSearch} placeholder="N° dossier, nom, CIN…" />
        </div>
      </div>
      <Card>
        <DataTable columns={columns} rows={data?.rows} getRowId={(d) => d.id} loading={isLoading} error={isError}
          errorMessage="Une erreur est survenue lors du chargement des demandes." onRetry={() => refetch()}
          emptyMessage="Aucune demande trouvée." sort={ls.sort} onSort={ls.toggleSort}
          onRowClick={(d) => navigate(`/demandes/${d.id}`)} />
        <Pagination page={ls.page} pageSize={ls.pageSize} total={data?.total ?? 0} onPage={ls.setPage} />
      </Card>
    </div>
  );
}
