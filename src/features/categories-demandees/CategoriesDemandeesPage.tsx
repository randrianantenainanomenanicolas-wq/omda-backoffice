import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import Card from '@/components/common/Card';
import DeleteAction from '@/components/common/DeleteAction';
import StatusBadge from '@/components/common/StatusBadge';
import { deleteCategorieDemandee } from '@/services/delete.service';
import { inputClass } from '@/components/forms/Field';
import DataTable, { type Column } from '@/components/tables/DataTable';
import Pagination from '@/components/tables/Pagination';
import Modal from '@/components/ui/Modal';
import { useCategories } from '@/features/membres/hooks';
import { useListState } from '@/hooks/useListState';
import { STATUTS_ADHESION_CATEGORIE, type StatutAdhesionCategorie } from '@/types/enums';
import type { CategorieDemandeeRow } from '@/types/models';
import { toFrenchMessage } from '@/utils/errors';
import { formatDate } from '@/utils/format';
import { adhesionCategorieMeta, oeuvreMeta } from '@/utils/statuts';
import { useCategoriesDemandees, useDecideCategorie, useOeuvresCategorie } from './hooks';

const nomDe = (r: CategorieDemandeeRow) => (r.membre?.candidat ? `${r.membre.candidat.prenom} ${r.membre.candidat.nom}` : '—');

export default function CategoriesDemandeesPage() {
  const ls = useListState({ sortKey: 'date_activation' });
  const [statut, setStatut] = useState<StatutAdhesionCategorie | ''>('EN_ATTENTE');
  const [categorieId, setCategorieId] = useState('');
  const [selected, setSelected] = useState<CategorieDemandeeRow | null>(null);
  const categories = useCategories();
  const decide = useDecideCategorie();
  const oeuvres = useOeuvresCategorie(selected?.membre?.id, selected?.categorie?.id);

  const { data, isLoading, isError, refetch } = useCategoriesDemandees({
    page: ls.page, pageSize: ls.pageSize, sortKey: ls.sort.key, ascending: ls.sort.ascending,
    statut: statut || undefined, categorieId: categorieId || undefined,
  });

  const columns: Column<CategorieDemandeeRow>[] = [
    { key: 'membre', header: 'Membre', render: (r) => <span className="font-medium">{nomDe(r)}</span> },
    { key: 'numero', header: 'N° adhérent', render: (r) => r.membre?.numero_adherent ?? '—' },
    { key: 'categorie', header: 'Catégorie demandée', render: (r) => r.categorie?.libelle ?? '—' },
    { key: 'statut', header: 'Statut', render: (r) => <StatusBadge {...adhesionCategorieMeta[r.statut]} /> },
    { key: 'date_activation', header: 'Date', sortable: true, render: (r) => formatDate(r.date_activation) },
    {
      key: 'actions', header: 'Actions',
      // Le clic ne doit pas ouvrir la fiche de décision de la ligne.
      render: (r) => (
        <span onClick={(e) => e.stopPropagation()}>
          <DeleteAction variant="icon" target={`la demande de catégorie « ${r.categorie?.libelle ?? ''} » de ${nomDe(r)}`} onDelete={() => deleteCategorieDemandee(r.id)} />
        </span>
      ),
    },
  ];

  const act = (accepter: boolean) => {
    if (!selected) return;
    decide.mutate({ row: selected, accepter }, {
      onSuccess: (r) => {
        toast.success(accepter ? 'Catégorie activée.' : 'Demande refusée.');
        if (!r.notified) toast.warning("La décision est enregistrée, mais la notification n'a pas pu être envoyée.");
        setSelected(null);
      },
      onError: (e) => { toast.error(toFrenchMessage(e, 'La décision a échoué.')); setSelected(null); },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Catégories demandées</h1>
          <p className="text-sm text-omda-textGray">Demandes de catégorie supplémentaire déposées par les membres depuis l'application mobile.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className={`${inputClass} !mt-0 w-auto`} value={statut} onChange={(e) => { setStatut(e.target.value as StatutAdhesionCategorie | ''); ls.resetPage(); }} aria-label="Filtrer par statut">
            <option value="">Tous les statuts</option>
            {STATUTS_ADHESION_CATEGORIE.map((s) => <option key={s} value={s}>{adhesionCategorieMeta[s].label}</option>)}
          </select>
          <select className={`${inputClass} !mt-0 w-auto`} value={categorieId} onChange={(e) => { setCategorieId(e.target.value); ls.resetPage(); }} aria-label="Filtrer par catégorie">
            <option value="">Toutes les catégories</option>
            {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
          </select>
        </div>
      </div>
      <Card>
        <DataTable columns={columns} rows={data?.rows} getRowId={(r) => r.id} loading={isLoading} error={isError}
          errorMessage="Une erreur est survenue lors du chargement des demandes de catégorie." onRetry={() => refetch()}
          emptyMessage="Aucune demande de catégorie." sort={ls.sort} onSort={ls.toggleSort} onRowClick={setSelected} />
        <Pagination page={ls.page} pageSize={ls.pageSize} total={data?.total ?? 0} onPage={ls.setPage} />
      </Card>

      {selected && (
        <Modal title="Demande de catégorie" onClose={() => setSelected(null)}>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-xs uppercase text-omda-textGray">Membre</dt>
              <dd>{selected.membre ? <Link className="text-omda-green hover:underline" to={`/membres/${selected.membre.id}`}>{nomDe(selected)} ({selected.membre.numero_adherent})</Link> : '—'}</dd></div>
            <div><dt className="text-xs uppercase text-omda-textGray">Catégorie demandée</dt><dd>{selected.categorie?.libelle ?? '—'}</dd></div>
            <div><dt className="text-xs uppercase text-omda-textGray">Statut</dt><dd><StatusBadge {...adhesionCategorieMeta[selected.statut]} /></dd></div>
          </dl>
          <h3 className="mb-1 mt-4 text-sm font-medium">Œuvres du membre dans cette catégorie</h3>
          {oeuvres.isLoading && <p className="text-sm text-omda-textGray">Chargement…</p>}
          {oeuvres.isError && <p className="text-sm text-omda-errorRed">Impossible de charger les œuvres.</p>}
          {oeuvres.data?.length === 0 && <p className="text-sm text-omda-textGray">Aucune œuvre rattachée.</p>}
          <ul className="divide-y divide-omda-warmGray text-sm">
            {oeuvres.data?.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2">
                <Link className="text-omda-green hover:underline" to={`/oeuvres/${o.id}`}>{o.titre}</Link>
                <StatusBadge {...oeuvreMeta[o.statut]} />
              </li>
            ))}
          </ul>
          {selected.statut === 'EN_ATTENTE' ? (
            <div className="mt-6 flex justify-end gap-2">
              <button disabled={decide.isPending} onClick={() => act(false)} className="inline-flex items-center gap-2 rounded-lg bg-omda-errorRed px-3 py-2 text-sm font-medium text-white hover:bg-omda-errorRed/90 disabled:opacity-60"><XCircle className="h-4 w-4" /> Refuser</button>
              <button disabled={decide.isPending} onClick={() => act(true)} className="inline-flex items-center gap-2 rounded-lg bg-omda-green px-3 py-2 text-sm font-medium text-white hover:bg-omda-greenDark disabled:opacity-60">
                {decide.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Activer la catégorie
              </button>
            </div>
          ) : <p className="mt-4 text-xs text-omda-textGray">Cette demande n'est plus en attente de décision.</p>}
        </Modal>
      )}
    </div>
  );
}
