import { useAuth } from '@/features/auth/AuthContext';
import ResourcePage from './ResourcePage';
import { ActifBadge, text } from './shared';

export default function CategoriesPage() {
  const { profile } = useAuth();
  return (
    <ResourcePage title="Catégories" entityLabel="la catégorie" table="categorie" orderBy={{ column: 'libelle' }}
      canEdit={profile?.role === 'ADMINISTRATEUR'}
      columns={[
        { key: 'code', header: 'Code', render: (r) => <span className="font-medium">{text(r.code)}</span> },
        { key: 'libelle', header: 'Libellé', render: (r) => text(r.libelle) },
        { key: 'description', header: 'Description', render: (r) => text(r.description) },
        { key: 'actif', header: 'Statut', render: (r) => <ActifBadge actif={r.actif} /> },
      ]}
      fields={[
        { name: 'code', label: 'Code', type: 'text', required: true, disabledOnEdit: true },
        { name: 'libelle', label: 'Libellé', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
        { name: 'actif', label: 'Catégorie active', type: 'checkbox', defaultValue: true },
      ]} />
  );
}
