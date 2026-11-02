import { useAuth } from '@/features/auth/AuthContext';
import ResourcePage from './ResourcePage';
import { ActifBadge, text } from './shared';

export default function DocumentationPage() {
  const { profile } = useAuth();
  return (
    <ResourcePage title="Documentation" entityLabel="la page" table="documentation" orderBy={{ column: 'ordre' }}
      canEdit={profile?.role === 'ADMINISTRATEUR'}
      columns={[
        { key: 'ordre', header: 'Ordre', render: (r) => text(r.ordre) },
        { key: 'titre', header: 'Titre', render: (r) => <span className="font-medium">{text(r.titre)}</span> },
        { key: 'slug', header: 'Identifiant (slug)', render: (r) => text(r.slug) },
        { key: 'publie', header: 'Statut', render: (r) => <ActifBadge actif={r.publie} on="Publiée" off="Brouillon" /> },
      ]}
      fields={[
        { name: 'slug', label: 'Identifiant (slug)', type: 'text', required: true, disabledOnEdit: true },
        { name: 'titre', label: 'Titre', type: 'text', required: true },
        { name: 'contenu', label: 'Contenu', type: 'textarea', required: true, rows: 10 },
        { name: 'ordre', label: 'Ordre', type: 'number', defaultValue: 0 },
        { name: 'publie', label: 'Publiée', type: 'checkbox', defaultValue: true },
      ]} />
  );
}
