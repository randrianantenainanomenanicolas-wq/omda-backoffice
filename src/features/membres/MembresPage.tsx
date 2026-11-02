import { useNavigate } from 'react-router-dom';
import Card from '@/components/common/Card';
import StatusBadge from '@/components/common/StatusBadge';
import { inputClass } from '@/components/forms/Field';
import DataTable, { type Column } from '@/components/tables/DataTable';
import Pagination from '@/components/tables/Pagination';
import SearchInput from '@/components/tables/SearchInput';
import ExportButton from '@/components/tables/ExportButton';
import { useListState } from '@/hooks/useListState';
import { fetchAllPages } from '@/services/helpers';
import { listMembres } from '@/services/membre.service';
import type { CsvColumn } from '@/utils/csv';
import { STATUTS_UTILISATEUR, type StatutUtilisateur } from '@/types/enums';
import type { MembreRow } from '@/types/models';
import { formatDate } from '@/utils/format';
import { utilisateurMeta } from '@/utils/statuts';
import { useState } from 'react';
import { useCategories, useMembers } from './hooks';

export default function MembresPage() {
  const navigate = useNavigate();
  const ls = useListState({ sortKey: 'created_at' });
  const [statut, setStatut] = useState<StatutUtilisateur | ''>('');
  const [categorieId, setCategorieId] = useState('');
  const categories = useCategories();

  const { data, isLoading, isError, refetch } = useMembers({
    page: ls.page, pageSize: ls.pageSize, search: ls.search, sortKey: ls.sort.key, ascending: ls.sort.ascending,
    statut: statut || undefined, categorieId: categorieId || undefined,
  });

  const columns: Column<MembreRow>[] = [
    { key: 'numero_adherent', header: 'N° adhérent', sortable: true, render: (m) => <span className="font-medium">{m.numero_adherent}</span> },
    { key: 'nom', header: 'Nom', render: (m) => m.candidat?.nom ?? '—' },
    { key: 'prenom', header: 'Prénom', render: (m) => m.candidat?.prenom ?? '—' },
    { key: 'categories', header: 'Catégorie', render: (m) => m.membre_categorie.map((mc) => mc.categorie?.libelle).filter(Boolean).join(', ') || '—' },
    { key: 'statut', header: 'Statut', sortable: true, render: (m) => <StatusBadge {...utilisateurMeta[m.statut]} /> },
    { key: 'created_at', header: "Date d'inscription", sortable: true, render: (m) => formatDate(m.created_at) },
    { key: 'actions', header: 'Actions', render: (m) => <button onClick={(e) => { e.stopPropagation(); navigate(`/membres/${m.id}`); }} className="text-omda-green hover:underline">Consulter</button> },
  ];

  const exportColumns: CsvColumn<MembreRow>[] = [
    { header: 'N° adhérent', value: (m) => m.numero_adherent },
    { header: 'Nom', value: (m) => m.candidat?.nom },
    { header: 'Prénom', value: (m) => m.candidat?.prenom },
    { header: 'Email', value: (m) => m.candidat?.email },
    { header: 'Téléphone', value: (m) => m.candidat?.telephone },
    { header: 'Catégories', value: (m) => m.membre_categorie.map((mc) => mc.categorie?.libelle).filter(Boolean).join(', ') },
    { header: 'Statut', value: (m) => utilisateurMeta[m.statut].label },
    { header: "Date d'inscription", value: (m) => formatDate(m.created_at) },
  ];
  const fetchAll = () => fetchAllPages((page, pageSize) => listMembres({
    page, pageSize, search: ls.search, sortKey: ls.sort.key, ascending: ls.sort.ascending,
    statut: statut || undefined, categorieId: categorieId || undefined,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Membres</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select className={`${inputClass} !mt-0 w-auto`} value={statut} onChange={(e) => { setStatut(e.target.value as StatutUtilisateur | ''); ls.resetPage(); }} aria-label="Filtrer par statut">
            <option value="">Tous les statuts</option>
            {STATUTS_UTILISATEUR.map((s) => <option key={s} value={s}>{utilisateurMeta[s].label}</option>)}
          </select>
          <select className={`${inputClass} !mt-0 w-auto`} value={categorieId} onChange={(e) => { setCategorieId(e.target.value); ls.resetPage(); }} aria-label="Filtrer par catégorie">
            <option value="">Toutes les catégories</option>
            {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
          </select>
          <ExportButton filename="membres" title="Liste des membres" columns={exportColumns} fetchAll={fetchAll} disabled={!data?.total} />
          <SearchInput onChange={ls.setSearch} placeholder="N° adhérent, nom, CIN…" />
        </div>
      </div>
      <Card>
        <DataTable columns={columns} rows={data?.rows} getRowId={(m) => m.id} loading={isLoading} error={isError}
          errorMessage="Une erreur est survenue lors du chargement des membres." onRetry={() => refetch()}
          emptyMessage="Aucun membre trouvé." sort={ls.sort} onSort={ls.toggleSort}
          onRowClick={(m) => navigate(`/membres/${m.id}`)} />
        <Pagination page={ls.page} pageSize={ls.pageSize} total={data?.total ?? 0} onPage={ls.setPage} />
      </Card>
    </div>
  );
}
