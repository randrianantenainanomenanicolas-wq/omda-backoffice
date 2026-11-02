import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import Card from '@/components/common/Card';
import EntityForm, { type FieldDef } from '@/components/forms/EntityForm';
import DataTable, { type Column } from '@/components/tables/DataTable';
import DeleteAction from '@/components/common/DeleteAction';
import Modal from '@/components/ui/Modal';
import { deleteResource } from '@/services/delete.service';
import { createResource, listResource, updateResource, type Row } from '@/services/resource.service';
import { toFrenchMessage } from '@/utils/errors';

interface Props {
  title: string;
  entityLabel: string;                 // ex. « la catégorie »
  table: string;
  select?: string;
  orderBy: { column: string; ascending?: boolean };
  idColumn?: string;
  columns: Column<Row>[];
  fields: FieldDef[];
  canEdit: boolean;
  canCreate?: boolean;
  intro?: string;
}

/** Écran CRUD réutilisé par les tables de référence (catégories, tarifs, documentation, coordonnées, opérateurs). */
export default function ResourcePage({
  title, entityLabel, table, select = '*', orderBy, idColumn = 'id', columns, fields, canEdit, canCreate = canEdit, intro,
}: Props) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Row | 'new' | null>(null);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['resource', table], queryFn: () => listResource(table, select, orderBy),
  });

  const save = useMutation({
    mutationFn: async (values: Row) => {
      if (editing === 'new') return createResource(table, values);
      const row = editing as Row;
      const payload = Object.fromEntries(fields.filter((f) => !f.disabledOnEdit).map((f) => [f.name, values[f.name]]));
      return updateResource(table, idColumn, row[idColumn], payload);
    },
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ['resource', table] }), qc.invalidateQueries({ queryKey: ['categories'] })]),
  });

  const cols: Column<Row>[] = canEdit
    ? [...columns, {
      key: '_actions', header: 'Actions',
      render: (r) => (
        <span className="inline-flex items-center gap-3">
          <button onClick={() => setEditing(r)} className="text-omda-green hover:underline">Modifier</button>
          <DeleteAction variant="icon" target={`${entityLabel} « ${String(r.libelle ?? r.titre ?? r.code ?? r[idColumn])} »`}
            onDelete={() => deleteResource(table, idColumn, String(r[idColumn]))} />
        </span>
      ),
    }]
    : columns;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {canCreate && (
          <button onClick={() => setEditing('new')} className="inline-flex items-center gap-2 rounded-lg bg-omda-green px-3 py-2 text-sm font-medium text-white hover:bg-omda-greenDark">
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        )}
      </div>
      {intro && <p className="text-sm text-omda-textGray">{intro}</p>}
      {!canEdit && <p className="rounded-lg bg-omda-warmGray px-3 py-2 text-sm text-omda-textGray">Consultation seule : la modification est réservée aux administrateurs.</p>}
      <Card>
        <DataTable columns={cols} rows={data} getRowId={(r) => String(r[idColumn])} loading={isLoading} error={isError}
          errorMessage={`Une erreur est survenue lors du chargement (${title.toLowerCase()}).`} onRetry={() => refetch()}
          emptyMessage="Aucun enregistrement." />
      </Card>

      {editing && (
        <Modal title={editing === 'new' ? `Ajouter ${entityLabel}` : `Modifier ${entityLabel}`} onClose={() => setEditing(null)}>
          <EntityForm fields={fields} initial={editing === 'new' ? undefined : editing} saving={save.isPending}
            onCancel={() => setEditing(null)}
            onSubmit={(v) => save.mutate(v, {
              onSuccess: () => { toast.success('Enregistrement effectué.'); setEditing(null); },
              onError: (e) => toast.error(toFrenchMessage(e, "L'enregistrement a échoué.")),
            })} />
        </Modal>
      )}
    </div>
  );
}
