import { useState } from 'react';
import DangerZone from '@/components/common/DangerZone';
import { deleteCandidat } from '@/services/delete.service';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Pencil } from 'lucide-react';
import Card, { InfoGrid } from '@/components/common/Card';
import DemandesTable from '@/components/common/DemandesTable';
import { PageSkeleton } from '@/components/common/Skeleton';
import Modal from '@/components/ui/Modal';
import { toFrenchMessage } from '@/utils/errors';
import { formatDate } from '@/utils/format';
import CandidatForm from './CandidatForm';
import { useCandidate, useCandidateDemandes, useCandidateMembreId, useUpdateCandidate } from './hooks';

export default function CandidatDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const { data: candidat, isLoading, isError } = useCandidate(id);
  const demandes = useCandidateDemandes(id);
  const membreId = useCandidateMembreId(id);
  const update = useUpdateCandidate(id);

  if (isLoading) return <PageSkeleton />;
  if (isError) return <p className="text-sm text-omda-errorRed">Une erreur est survenue lors du chargement du candidat.</p>;
  if (!candidat) return <p className="text-sm text-omda-textGray">Candidat introuvable.</p>;

  return (
    <div className="space-y-4">
      <Link to="/candidats" className="inline-flex items-center gap-1 text-sm text-omda-textGray hover:text-omda-black"><ArrowLeft className="h-4 w-4" /> Candidats</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{candidat.prenom} {candidat.nom}</h1>
        <div className="flex items-center gap-2">
          {membreId.data && <Link to={`/membres/${membreId.data}`} className="rounded-lg border border-omda-borderGray px-3 py-2 text-sm hover:bg-omda-warmGray">Voir la fiche membre</Link>}
          <button onClick={() => setEditing(true)} className="flex items-center gap-2 rounded-lg bg-omda-green px-3 py-2 text-sm font-medium text-white hover:bg-omda-greenDark"><Pencil className="h-4 w-4" /> Modifier</button>
        </div>
      </div>

      <Card title="Informations">
        <InfoGrid items={[
          ['CIN', candidat.cin], ['Date de naissance', formatDate(candidat.date_naissance)],
          ['Téléphone', candidat.telephone], ['Email', candidat.email], ['Adresse', candidat.adresse],
          ['Compte utilisateur', candidat.utilisateur_id ? 'Oui' : 'Non'],
          ['Créé le', formatDate(candidat.created_at)], ['Modifié le', formatDate(candidat.updated_at)],
        ]} />
      </Card>

      <Card title="Dossier : demandes d'adhésion">
        <DemandesTable rows={demandes.data} loading={demandes.isLoading} error={demandes.isError} />
      </Card>

      {editing && (
        <Modal title="Modifier le candidat" onClose={() => setEditing(false)}>
          <CandidatForm candidat={candidat} saving={update.isPending} onCancel={() => setEditing(false)}
            onSubmit={(v) => update.mutate(v, {
              onSuccess: () => { toast.success('Candidat mis à jour.'); setEditing(false); },
              onError: (e) => toast.error(toFrenchMessage(e, "La modification du candidat a échoué.")),
            })} />
        </Modal>
      )}
      <DangerZone target={`le candidat ${candidat.prenom} ${candidat.nom}`} confirmWord="SUPPRIMER"
        description="Supprime la fiche du candidat. Impossible tant qu'il a des demandes, des paiements ou qu'il est devenu membre."
        onDelete={() => deleteCandidat(candidat.id)} onDone={() => navigate('/candidats')} />
    </div>
  );
}
