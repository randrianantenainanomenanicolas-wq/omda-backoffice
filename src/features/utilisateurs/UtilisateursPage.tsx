import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import Avatar from '@/components/common/Avatar';
import Card from '@/components/common/Card';
import DeleteAction from '@/components/common/DeleteAction';
import StatusBadge from '@/components/common/StatusBadge';
import { inputClass } from '@/components/forms/Field';
import DataTable, { type Column } from '@/components/tables/DataTable';
import ExportButton from '@/components/tables/ExportButton';
import Pagination from '@/components/tables/Pagination';
import SearchInput from '@/components/tables/SearchInput';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/features/auth/AuthContext';
import { useListState } from '@/hooks/useListState';
import { deleteStaffUser, resetUserPassword } from '@/services/admin.service';
import { fetchAllPages } from '@/services/helpers';
import { listUtilisateurs } from '@/services/utilisateur.service';
import type { CsvColumn } from '@/utils/csv';
import { ROLES, STATUTS_UTILISATEUR, type RoleUtilisateur, type StatutUtilisateur } from '@/types/enums';
import type { Utilisateur } from '@/types/models';
import type { UtilisateurInput } from '@/services/utilisateur.service';
import { toFrenchMessage } from '@/utils/errors';
import { formatDate, formatDateTime } from '@/utils/format';
import { roleLabels, utilisateurMeta } from '@/utils/statuts';
import CreateUserModal from './CreateUserModal';
import CredentialsModal from './CredentialsModal';
import UtilisateurForm from './UtilisateurForm';
import { useUpdateUser, useUsers } from './hooks';

export default function UtilisateursPage() {
  const { profile } = useAuth();
  const ls = useListState({ sortKey: 'created_at' });
  const [role, setRole] = useState<RoleUtilisateur | ''>('');
  const [statut, setStatut] = useState<StatutUtilisateur | ''>('');
  const [editing, setEditing] = useState<Utilisateur | null>(null);
  const [pending, setPending] = useState<UtilisateurInput | null>(null);
  const update = useUpdateUser();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<Utilisateur | null>(null);
  const [credentials, setCredentials] = useState<{ title: string; email: string; password: string } | null>(null);
  const reset = useMutation({ mutationFn: (u: Utilisateur) => resetUserPassword(u.id).then((r) => ({ u, ...r })) });

  const { data, isLoading, isError, refetch } = useUsers({
    page: ls.page, pageSize: ls.pageSize, search: ls.search, sortKey: ls.sort.key, ascending: ls.sort.ascending,
    role: role || undefined, statut: statut || undefined,
  });

  const save = (values: UtilisateurInput) => {
    if (!editing) return;
    update.mutate({ id: editing.id, values }, {
      onSuccess: () => { toast.success('Utilisateur mis à jour.'); setEditing(null); setPending(null); },
      onError: (e) => { setPending(null); toast.error(toFrenchMessage(e, "La modification de l'utilisateur a échoué.")); },
    });
  };
  // Toute modification demande une confirmation ; un changement de rôle ou une désactivation reçoit un avertissement renforcé.
  const submit = (values: UtilisateurInput) => { if (editing) setPending(values); };
  const pendingSensitive = !!(editing && pending && (pending.role !== editing.role || (pending.statut === 'DESACTIVE' && editing.statut !== 'DESACTIVE')));

  const doReset = () => {
    if (!resetting) return;
    reset.mutate(resetting, {
      onSuccess: (r) => {
        setResetting(null);
        setCredentials({ title: 'Mot de passe réinitialisé', email: r.u.email, password: r.temporaryPassword });
        void qc.invalidateQueries();
      },
      onError: (e) => { setResetting(null); toast.error(toFrenchMessage(e, 'La réinitialisation a échoué.')); },
    });
  };

  const exportColumns: CsvColumn<Utilisateur>[] = [
    { header: 'Email', value: (u) => u.email }, { header: 'Téléphone', value: (u) => u.telephone },
    { header: 'Rôle', value: (u) => roleLabels[u.role] }, { header: 'Statut', value: (u) => utilisateurMeta[u.statut].label },
    { header: 'Dernière connexion', value: (u) => formatDateTime(u.derniere_connexion_at) }, { header: 'Créé le', value: (u) => formatDate(u.created_at) },
  ];
  const fetchAll = () => fetchAllPages((page, pageSize) => listUtilisateurs({
    page, pageSize, search: ls.search, sortKey: ls.sort.key, ascending: ls.sort.ascending, role: role || undefined, statut: statut || undefined,
  }));

  const iconBtn = 'rounded p-1.5 text-omda-textGray hover:bg-omda-green/10 hover:text-omda-green';
  const columns: Column<Utilisateur>[] = [
    { key: 'email', header: 'Email', sortable: true, render: (u) => <span className="flex items-center gap-2.5"><Avatar path={u.photo_path} label={u.email} size="sm" /><span className="font-medium">{u.email}</span></span> },
    { key: 'telephone', header: 'Téléphone', render: (u) => u.telephone ?? '—' },
    { key: 'role', header: 'Rôle', sortable: true, render: (u) => roleLabels[u.role] },
    { key: 'statut', header: 'Statut', sortable: true, render: (u) => <StatusBadge {...utilisateurMeta[u.statut]} /> },
    { key: 'derniere_connexion_at', header: 'Dernière connexion', sortable: true, render: (u) => formatDateTime(u.derniere_connexion_at) },
    { key: 'created_at', header: 'Créé le', sortable: true, render: (u) => formatDate(u.created_at) },
    {
      key: 'actions', header: 'Actions',
      render: (u) => {
        const self = u.id === profile?.id;
        const staff = u.role !== 'MEMBRE';
        return (
          <span className="inline-flex items-center gap-0.5">
            <button onClick={() => setEditing(u)} title="Modifier" aria-label={`Modifier ${u.email}`} className={iconBtn}><Pencil className="h-4 w-4" /></button>
            {staff && !self && (
              <button onClick={() => setResetting(u)} title="Réinitialiser le mot de passe" aria-label={`Réinitialiser le mot de passe de ${u.email}`} className={iconBtn}><KeyRound className="h-4 w-4" /></button>
            )}
            {staff && !self && (
              <DeleteAction variant="icon" target={`le compte ${u.email}`} confirmWord="SUPPRIMER" consequences="Son accès au Back Office sera définitivement retiré."
                onDelete={() => deleteStaffUser(u.id).then(() => undefined)} />
            )}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Utilisateurs</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select className={`${inputClass} !mt-0 w-auto`} value={role} onChange={(e) => { setRole(e.target.value as RoleUtilisateur | ''); ls.resetPage(); }} aria-label="Filtrer par rôle">
            <option value="">Tous les rôles</option>
            {ROLES.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
          </select>
          <select className={`${inputClass} !mt-0 w-auto`} value={statut} onChange={(e) => { setStatut(e.target.value as StatutUtilisateur | ''); ls.resetPage(); }} aria-label="Filtrer par statut">
            <option value="">Tous les statuts</option>
            {STATUTS_UTILISATEUR.map((s) => <option key={s} value={s}>{utilisateurMeta[s].label}</option>)}
          </select>
          <ExportButton filename="utilisateurs" title="Comptes utilisateurs" columns={exportColumns} fetchAll={fetchAll} disabled={!data?.total} />
          <SearchInput onChange={ls.setSearch} placeholder="Email, téléphone…" />
          <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 rounded-lg bg-omda-green px-3 py-2 text-sm font-medium text-white hover:bg-omda-greenDark">
            <Plus className="h-4 w-4" /> Ajouter un utilisateur
          </button>
        </div>
      </div>
      <Card>
        <DataTable columns={columns} rows={data?.rows} getRowId={(u) => u.id} loading={isLoading} error={isError}
          errorMessage="Une erreur est survenue lors du chargement des utilisateurs." onRetry={() => refetch()}
          emptyMessage="Aucun utilisateur trouvé." sort={ls.sort} onSort={ls.toggleSort} />
        <Pagination page={ls.page} pageSize={ls.pageSize} total={data?.total ?? 0} onPage={ls.setPage} />
      </Card>

      {editing && !pending && (
        <Modal title="Modifier l'utilisateur" onClose={() => setEditing(null)}>
          <UtilisateurForm user={editing} isSelf={editing.id === profile?.id} saving={update.isPending}
            onSubmit={submit} onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {creating && (
        <CreateUserModal onClose={() => setCreating(false)}
          onCreated={(c) => { setCreating(false); setCredentials({ title: 'Compte créé', email: c.email, password: c.temporaryPassword }); void qc.invalidateQueries(); }} />
      )}
      {resetting && (
        <ConfirmDialog title="Réinitialiser le mot de passe" loading={reset.isPending} confirmLabel="Réinitialiser"
          message={`Un nouveau mot de passe temporaire sera généré pour ${resetting.email}. Son ancien mot de passe cessera de fonctionner et il devra en choisir un nouveau à sa prochaine connexion.`}
          onConfirm={doReset} onCancel={() => setResetting(null)} />
      )}
      {credentials && <CredentialsModal {...credentials} onClose={() => setCredentials(null)} />}
      {editing && pending && (
        <ConfirmDialog title="Enregistrer les modifications" loading={update.isPending} confirmLabel="Oui" cancelLabel="Non"
          message={pendingSensitive
            ? `Vous êtes sur le point de modifier le rôle ou le statut de ${editing.email}. Cette action a un effet immédiat sur ses accès. Continuer ?`
            : `Voulez-vous enregistrer les modifications du compte ${editing.email} ?`}
          onConfirm={() => save(pending)} onCancel={() => setPending(null)} />
      )}
    </div>
  );
}
