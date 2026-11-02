import { useState } from 'react';
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
import { listPaiements } from '@/services/paiement.service';
import type { CsvColumn } from '@/utils/csv';
import { STATUTS_PAIEMENT, TYPES_PAIEMENT, type StatutPaiement, type TypePaiement } from '@/types/enums';
import type { PaiementRow } from '@/types/models';
import { formatDateTime, formatMontant } from '@/utils/format';
import { modePaiementLabels, operateurLabels, paiementMeta, typePaiementLabels } from '@/utils/statuts';
import { usePaiements } from './hooks';

export const payeurDe = (p: { membre: { candidat: { nom: string; prenom: string } | null } | null; candidat: { nom: string; prenom: string } | null }) => {
  const c = p.membre?.candidat ?? p.candidat;
  return c ? `${c.prenom} ${c.nom}` : '—';
};

export default function PaiementsPage() {
  const navigate = useNavigate();
  const ls = useListState({ sortKey: 'date_initiation' });
  const [statut, setStatut] = useState<StatutPaiement | ''>('');
  const [type, setType] = useState<TypePaiement | ''>('');
  const { data, isLoading, isError, refetch } = usePaiements({
    page: ls.page, pageSize: ls.pageSize, search: ls.search, sortKey: ls.sort.key, ascending: ls.sort.ascending,
    statut: statut || undefined, type: type || undefined,
  });

  const columns: Column<PaiementRow>[] = [
    { key: 'reference_interne', header: 'Référence', sortable: true, render: (p) => <span className="font-medium">{p.reference_interne}</span> },
    { key: 'type', header: 'Type', render: (p) => typePaiementLabels[p.type] },
    { key: 'payeur', header: 'Payeur', render: (p) => payeurDe(p) },
    { key: 'mode', header: 'Mode', render: (p) => `${modePaiementLabels[p.mode]}${p.operateur ? ` (${operateurLabels[p.operateur]})` : ''}` },
    { key: 'montant', header: 'Montant', sortable: true, render: (p) => formatMontant(p.montant, p.devise) },
    { key: 'statut', header: 'Statut', sortable: true, render: (p) => <StatusBadge {...paiementMeta[p.statut]} /> },
    { key: 'date_initiation', header: 'Initié le', sortable: true, render: (p) => formatDateTime(p.date_initiation) },
  ];
  const exportColumns: CsvColumn<PaiementRow>[] = [
    { header: 'Référence', value: (p) => p.reference_interne },
    { header: 'Référence MVola', value: (p) => p.reference_externe },
    { header: 'Type', value: (p) => typePaiementLabels[p.type] },
    { header: 'Payeur', value: (p) => payeurDe(p) },
    { header: 'Montant', value: (p) => p.montant },
    { header: 'Devise', value: (p) => p.devise },
    { header: 'Statut', value: (p) => paiementMeta[p.statut].label },
    { header: 'Initié le', value: (p) => formatDateTime(p.date_initiation) },
  ];
  const fetchAll = () => fetchAllPages((page, pageSize) => listPaiements({
    page, pageSize, search: ls.search, sortKey: ls.sort.key, ascending: ls.sort.ascending,
    statut: statut || undefined, type: type || undefined,
  }));
  const sel = `${inputClass} !mt-0 w-auto`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Paiements</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select className={sel} value={statut} onChange={(e) => { setStatut(e.target.value as StatutPaiement | ''); ls.resetPage(); }} aria-label="Filtrer par statut">
            <option value="">Tous les statuts</option>
            {STATUTS_PAIEMENT.map((s) => <option key={s} value={s}>{paiementMeta[s].label}</option>)}
          </select>
          <select className={sel} value={type} onChange={(e) => { setType(e.target.value as TypePaiement | ''); ls.resetPage(); }} aria-label="Filtrer par type">
            <option value="">Tous les types</option>
            {TYPES_PAIEMENT.filter((t) => t !== 'COTISATION').map((t) => <option key={t} value={t}>{typePaiementLabels[t]}</option>)}
          </select>
          <ExportButton filename="paiements" title="Liste des paiements" columns={exportColumns} fetchAll={fetchAll} disabled={!data?.total} />
          <SearchInput onChange={ls.setSearch} placeholder="Référence, téléphone…" />
        </div>
      </div>
      <Card>
        <DataTable columns={columns} rows={data?.rows} getRowId={(p) => p.id} loading={isLoading} error={isError}
          errorMessage="Une erreur est survenue lors du chargement des paiements." onRetry={() => refetch()}
          emptyMessage="Aucun paiement trouvé." sort={ls.sort} onSort={ls.toggleSort}
          onRowClick={(p) => navigate(`/paiements/${p.id}`)} />
        <Pagination page={ls.page} pageSize={ls.pageSize} total={data?.total ?? 0} onPage={ls.setPage} />
      </Card>
    </div>
  );
}
