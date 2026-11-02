import { useAuth } from '@/features/auth/AuthContext';
import { useCategories } from '@/features/membres/hooks';
import { TYPES_OPERATION_TARIF } from '@/types/enums';
import { formatDate, formatMontant } from '@/utils/format';
import { typePaiementLabels } from '@/utils/statuts';
import ResourcePage from './ResourcePage';
import { ActifBadge } from './shared';

export default function TarifsPage() {
  const { profile } = useAuth();
  const categories = useCategories();
  return (
    <ResourcePage title="Tarifs" entityLabel="le tarif" table="tarif" select="*, categorie:categorie(libelle)"
      orderBy={{ column: 'type_operation' }} canEdit={profile?.role === 'ADMINISTRATEUR'}
      intro="Un seul tarif actif est autorisé par opération et par catégorie (ou pour toutes les catégories)."
      columns={[
        { key: 'op', header: 'Opération', render: (r) => <span className="font-medium">{typePaiementLabels[r.type_operation as keyof typeof typePaiementLabels]}</span> },
        { key: 'cat', header: 'Catégorie', render: (r) => (r.categorie as { libelle: string } | null)?.libelle ?? 'Toutes' },
        { key: 'montant', header: 'Montant', render: (r) => formatMontant(Number(r.montant), String(r.devise)) },
        { key: 'debut', header: 'Début', render: (r) => formatDate(r.date_debut as string | null) },
        { key: 'fin', header: 'Fin', render: (r) => formatDate(r.date_fin as string | null) },
        { key: 'actif', header: 'Statut', render: (r) => <ActifBadge actif={r.actif} /> },
      ]}
      fields={[
        { name: 'type_operation', label: 'Opération', type: 'select', required: true,
          options: TYPES_OPERATION_TARIF.map((t) => ({ value: t, label: typePaiementLabels[t] })), defaultValue: TYPES_OPERATION_TARIF[0] },
        { name: 'categorie_id', label: 'Catégorie', type: 'select',
          options: [{ value: '', label: 'Toutes les catégories' }, ...(categories.data ?? []).map((c) => ({ value: c.id, label: c.libelle }))] },
        { name: 'montant', label: 'Montant', type: 'number', required: true, min: 0 },
        { name: 'devise', label: 'Devise', type: 'text', required: true, minLength: 3, maxLength: 3, defaultValue: 'MGA' },
        { name: 'date_debut', label: 'Date de début', type: 'date' },
        { name: 'date_fin', label: 'Date de fin', type: 'date' },
        { name: 'actif', label: 'Tarif actif', type: 'checkbox', defaultValue: true },
      ]} />
  );
}
