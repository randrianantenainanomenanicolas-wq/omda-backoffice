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
import { fetchAllPages } from '@/services/helpers';
import { listOeuvres } from '@/services/oeuvre.service';
import type { CsvColumn } from '@/utils/csv';
import { STATUTS_OEUVRE, type StatutOeuvre } from '@/types/enums';
import type { OeuvreRow } from '@/types/models';
import { formatDate } from '@/utils/format';
import { oeuvreMeta } from '@/utils/statuts';
import { useOeuvres } from './hooks';

export const auteurDe = (o: { membre: { candidat: { nom: string; prenom: string } | null } | null; demande: { candidat: { nom: string; prenom: string } | null } | null }) => {
  const c = o.membre?.candidat ?? o.demande?.candidat;
  return c ? `${c.prenom} ${c.nom}` : '—';
};

export default function OeuvresPage() {
  const navigate = useNavigate();
  const ls = useListState({ sortKey: 'created_at' });
  const [statut, setStatut] = useState<StatutOeuvre | ''>('');
  const [categorieId, setCategorieId] = useState('');
  const categories = useCategories();
  const { data, isLoading, isError, refetch } = useOeuvres({
    page: ls.page, pageSize: ls.pageSize, search: ls.search, sortKey: ls.sort.key, ascending: ls.sort.ascending,
    statut: statut || undefined, categorieId: categorieId || undefined,
  });

  const columns: Column<OeuvreRow>[] = [
    { key: 'titre', header: 'Titre', sortable: true, render: (o) => <span className="font-medium">{o.titre}</span> },
    { key: 'auteur', header: 'Auteur', render: (o) => auteurDe(o) },
    { key: 'categorie', header: 'Catégorie', render: (o) => o.categorie?.libelle ?? '—' },
    { key: 'annee', header: 'Année', sortable: true, render: (o) => o.annee ?? '—' },
    { key: 'statut', header: 'Statut', sortable: true, render: (o) => <StatusBadge {...oeuvreMeta[o.statut]} /> },
    { key: 'date_soumission', header: 'Soumise le', sortable: true, render: (o) => formatDate(o.date_soumission) },
  ];

  const exportColumns: CsvColumn<OeuvreRow>[] = [
    { header: 'Titre', value: (o) => o.titre }, { header: 'Auteur', value: (o) => auteurDe(o) },
    { header: 'Catégorie', value: (o) => o.categorie?.libelle }, { header: 'Année', value: (o) => o.annee },
    { header: 'Statut', value: (o) => oeuvreMeta[o.statut].label }, { header: 'Soumise le', value: (o) => formatDate(o.date_soumission) },
  ];
  const fetchAll = () => fetchAllPages((page, pageSize) => listOeuvres({
    page, pageSize, search: ls.search, sortKey: ls.sort.key, ascending: ls.sort.ascending,
    statut: statut || undefined, categorieId: categorieId || undefined,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Œuvres</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select className={`${inputClass} !mt-0 w-auto`} value={statut} onChange={(e) => { setStatut(e.target.value as StatutOeuvre | ''); ls.resetPage(); }} aria-label="Filtrer par statut">
            <option value="">Tous les statuts</option>
            {STATUTS_OEUVRE.map((s) => <option key={s} value={s}>{oeuvreMeta[s].label}</option>)}
          </select>
          <select className={`${inputClass} !mt-0 w-auto`} value={categorieId} onChange={(e) => { setCategorieId(e.target.value); ls.resetPage(); }} aria-label="Filtrer par catégorie">
            <option value="">Toutes les catégories</option>
            {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
          </select>
          <ExportButton filename="oeuvres" title="Liste des œuvres" columns={exportColumns} fetchAll={fetchAll} disabled={!data?.total} />
          <SearchInput onChange={ls.setSearch} placeholder="Titre de l'œuvre…" />
        </div>
      </div>
      <Card>
        <DataTable columns={columns} rows={data?.rows} getRowId={(o) => o.id} loading={isLoading} error={isError}
          errorMessage="Une erreur est survenue lors du chargement des œuvres." onRetry={() => refetch()}
          emptyMessage="Aucune œuvre trouvée." sort={ls.sort} onSort={ls.toggleSort}
          onRowClick={(o) => navigate(`/oeuvres/${o.id}`)} />
        <Pagination page={ls.page} pageSize={ls.pageSize} total={data?.total ?? 0} onPage={ls.setPage} />
      </Card>
    </div>
  );
}
