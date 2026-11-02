import { useState, type ReactNode } from 'react';
import DangerZone from '@/components/common/DangerZone';
import { deleteDemande } from '@/services/delete.service';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Download, PlayCircle, XCircle } from 'lucide-react';
import Card, { InfoGrid } from '@/components/common/Card';
import { Spinner } from '@/components/common/Spinner';
import { PageSkeleton } from '@/components/common/Skeleton';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable, { type Column } from '@/components/tables/DataTable';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/features/auth/AuthContext';
import { getPieceSignedUrl } from '@/services/demande.service';
import type { OeuvreDossier, PaiementResume, Piece } from '@/types/models';
import { controleDossier, DELAI_INDICATIF_HEURES, estHorsDelai, MIN_OEUVRES_ADHESION, regleValidation, resumeManques } from '@/utils/dossier';
import { toFrenchMessage } from '@/utils/errors';
import { formatDate, formatDateTime, formatMontant, formatTaille } from '@/utils/format';
import { demandeMeta, modePaiementLabels, oeuvreMeta, operateurLabels, paiementMeta, typePaiementLabels, typePieceLabels } from '@/utils/statuts';
import { RejectDialog } from './DemandeActions';
import { useDemande, useDemandePaiements, useOeuvresDossier, usePieces, usePrendreEnCharge, useRejeter, useValider } from './hooks';

const Check = ({ ok, children }: { ok: boolean; children: ReactNode }) => (
  <li className="flex items-start gap-2 text-sm">
    {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-omda-green" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-omda-ochreDark" />}
    <span>{children}</span>
  </li>
);

export default function DemandeDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [dialog, setDialog] = useState<'valider' | 'rejeter' | null>(null);

  const { data: d, isLoading, isError } = useDemande(id);
  const pieces = usePieces(id);
  const oeuvres = useOeuvresDossier(id);
  const paiements = useDemandePaiements(id);
  const prendre = usePrendreEnCharge();
  const rejeter = useRejeter();
  const valider = useValider();

  if (isLoading) return <PageSkeleton />;
  if (isError) return <p className="text-sm text-omda-errorRed">Une erreur est survenue lors du chargement de la demande.</p>;
  if (!d || !profile) return <p className="text-sm text-omda-textGray">Demande introuvable.</p>;

  const c = d.candidat;
  const decidable = d.statut === 'ENVOYEE' || d.statut === 'EN_COURS_DE_VERIFICATION';
  const horsDelai = estHorsDelai(d.statut, d.date_soumission);
  const controle = pieces.data && oeuvres.data
    ? controleDossier({
        dateNaissance: c?.date_naissance ?? null, dateSoumission: d.date_soumission, pieces: pieces.data,
        oeuvres: oeuvres.data.map((o) => ({ titre: o.titre, nbAttestations: o.attestations.length })),
      })
    : null;

  const regle = regleValidation(controle, profile.role === 'ADMINISTRATEUR');
  const manques = controle ? resumeManques(controle) : [];

  const openPiece = async (p: Piece) => {
    try { window.open(await getPieceSignedUrl(p.chemin_stockage), '_blank', 'noopener'); }
    catch (e) { toast.error(toFrenchMessage(e, "Impossible d'ouvrir ce fichier.")); }
  };
  const onError = (fallback: string) => (e: unknown) => { toast.error(toFrenchMessage(e, fallback)); setDialog(null); };
  const warnIfNotNotified = (notified: boolean) => {
    if (!notified) toast.warning("La décision est enregistrée, mais la notification n'a pas pu être envoyée.");
  };

  const pieceCols: Column<Piece>[] = [
    { key: 'type', header: 'Type de pièce', render: (p) => <span className="font-medium">{typePieceLabels[p.type]}</span> },
    { key: 'mime', header: 'Fichier', render: (p) => p.mime_type },
    { key: 'taille', header: 'Taille', render: (p) => formatTaille(p.taille_octets) },
    { key: 'date', header: 'Déposée le', render: (p) => formatDateTime(p.created_at) },
    { key: 'actions', header: 'Action', render: (p) => <button onClick={() => openPiece(p)} className="inline-flex items-center gap-1 text-omda-green hover:underline"><Download className="h-4 w-4" /> Consulter</button> },
  ];
  const oeuvreCols: Column<OeuvreDossier>[] = [
    { key: 'titre', header: 'Œuvre', render: (o) => <span className="font-medium">{o.titre}</span> },
    { key: 'att', header: 'Attestations', render: (o) => o.attestations.length },
    { key: 'statut', header: 'Statut', render: (o) => <StatusBadge {...oeuvreMeta[o.statut]} /> },
  ];
  const paiementCols: Column<PaiementResume>[] = [
    { key: 'ref', header: 'Référence', render: (p) => <span className="font-medium">{p.reference_interne}</span> },
    { key: 'type', header: 'Type', render: (p) => typePaiementLabels[p.type] },
    { key: 'mode', header: 'Mode', render: (p) => `${modePaiementLabels[p.mode]}${p.operateur ? ` (${operateurLabels[p.operateur]})` : ''}` },
    { key: 'montant', header: 'Montant', render: (p) => formatMontant(p.montant, p.devise) },
    { key: 'statut', header: 'Statut', render: (p) => <StatusBadge {...paiementMeta[p.statut]} /> },
  ];

  return (
    <div className="space-y-4">
      <Link to="/demandes" className="inline-flex items-center gap-1 text-sm text-omda-textGray hover:text-omda-black"><ArrowLeft className="h-4 w-4" /> Demandes</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">Dossier {d.numero_dossier}</h1>
          <StatusBadge {...demandeMeta[d.statut]} />
          {horsDelai && <StatusBadge label={`Hors délai (${DELAI_INDICATIF_HEURES} h)`} tone="amber" />}
        </div>
        {decidable && (
          <div className="flex flex-wrap gap-2">
            {d.statut === 'ENVOYEE' && (
              <button disabled={prendre.isPending}
                onClick={() => prendre.mutate({ id: d.id, agentId: profile.id }, {
                  onSuccess: () => toast.success('Demande prise en charge.'), onError: onError('La prise en charge a échoué.'),
                })}
                className="inline-flex items-center gap-2 rounded-lg border border-omda-borderGray px-3 py-2 text-sm hover:bg-omda-warmGray disabled:opacity-60">
                <PlayCircle className="h-4 w-4" /> Prendre en charge
              </button>
            )}
            <button onClick={() => setDialog('rejeter')} className="inline-flex items-center gap-2 rounded-lg bg-omda-errorRed px-3 py-2 text-sm font-medium text-white hover:bg-omda-errorRed/90"><XCircle className="h-4 w-4" /> Rejeter</button>
            <button onClick={() => setDialog('valider')} disabled={regle.bloquee}
              title={regle.bloquee ? (controle ? 'Dossier incomplet : validation impossible' : 'Contrôle du dossier en cours…') : undefined}
              className="inline-flex items-center gap-2 rounded-lg bg-omda-green px-3 py-2 text-sm font-medium text-white hover:bg-omda-greenDark disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-omda-green"><CheckCircle2 className="h-4 w-4" /> Valider le dossier</button>
          </div>
        )}
      </div>

      {decidable && controle && regle.bloquee && (
        <p role="alert" className="rounded-lg bg-omda-ochre/15 px-4 py-3 text-sm text-omda-ochreDark">
          <span className="font-medium">Validation impossible : le dossier est incomplet.</span> {manques.join(' ; ')}. Vous pouvez rejeter le dossier en indiquant au candidat ce qu'il doit compléter.
        </p>
      )}
      {decidable && regle.avertir && (
        <p role="alert" className="rounded-lg bg-omda-ochre/15 px-4 py-3 text-sm text-omda-ochreDark">
          <span className="font-medium">Dossier incomplet :</span> {manques.join(' ; ')}. En tant qu'administrateur, vous pouvez le valider malgré tout.
        </p>
      )}

      {d.statut === 'REJETEE' && d.motif_rejet && (
        <p className="rounded-lg bg-omda-errorRed/10 px-4 py-3 text-sm text-omda-errorRed"><span className="font-medium">Motif du rejet (visible par le candidat) :</span> {d.motif_rejet}</p>
      )}
      {d.statut === 'VALIDEE' && (
        <p className="flex items-start gap-2 rounded-lg bg-omda-ochre/15 px-4 py-3 text-sm text-omda-ochreDark"><Clock className="mt-0.5 h-4 w-4 shrink-0" />
          Dossier validé : en attente du paiement des frais d'adhésion par le candidat (MVola). Le membre et son numéro d'adhérent seront créés automatiquement par le serveur après paiement confirmé.</p>
      )}

      <Card title="Demande">
        <InfoGrid items={[
          ['Catégorie demandée', d.categorie?.libelle], ['Soumise le', formatDateTime(d.date_soumission)],
          ['Décision le', formatDateTime(d.date_decision)], ['Créée le', formatDate(d.created_at)],
          ['Membre rattaché', d.membre_id ? <Link className="text-omda-green hover:underline" to={`/membres/${d.membre_id}`}>Consulter</Link> : '—'],
        ]} />
      </Card>

      <Card title="Contrôle du dossier">
        {!controle ? <div className="flex justify-center py-6"><Spinner className="h-6 w-6" /></div> : (
          <ul className="space-y-2 p-5">
            <Check ok={controle.piecesManquantes.length === 0}>
              {controle.piecesManquantes.length === 0 ? 'Toutes les pièces obligatoires sont présentes.' : `Pièces manquantes : ${controle.piecesManquantes.map((t) => typePieceLabels[t]).join(', ')}.`}
            </Check>
            {controle.autorisationParentaleRequise && <li className="text-sm text-omda-infoBlueGray">Candidat mineur (15–17 ans) : l'autorisation parentale est obligatoire.</li>}
            <Check ok={controle.nbOeuvres >= MIN_OEUVRES_ADHESION}>{controle.nbOeuvres} œuvre(s) déposée(s) (minimum {MIN_OEUVRES_ADHESION}).</Check>
            <Check ok={controle.oeuvresSansAttestation.length === 0}>
              {controle.oeuvresSansAttestation.length === 0 ? 'Chaque œuvre a au moins une attestation de diffusion.' : `Sans attestation : ${controle.oeuvresSansAttestation.join(', ')}.`}
            </Check>
          </ul>
        )}
      </Card>

      <Card title="Candidat" action={c && <Link className="text-sm text-omda-green hover:underline" to={`/candidats/${c.id}`}>Fiche complète</Link>}>
        <InfoGrid items={[
          ['Nom', c ? `${c.prenom} ${c.nom}` : '—'], ['CIN', c?.cin], ['Date de naissance', formatDate(c?.date_naissance)],
          ['Téléphone', c?.telephone], ['Email', c?.email], ['Adresse', c?.adresse],
        ]} />
      </Card>

      <Card title="Pièces justificatives">
        <DataTable columns={pieceCols} rows={pieces.data} getRowId={(p) => p.id} loading={pieces.isLoading} error={pieces.isError}
          errorMessage="Une erreur est survenue lors du chargement des pièces." emptyMessage="Aucune pièce déposée." />
      </Card>

      <Card title="Œuvres du dossier">
        <DataTable columns={oeuvreCols} rows={oeuvres.data} getRowId={(o) => o.id} loading={oeuvres.isLoading} error={oeuvres.isError}
          errorMessage="Une erreur est survenue lors du chargement des œuvres." emptyMessage="Aucune œuvre dans ce dossier."
          onRowClick={(o) => navigate(`/oeuvres/${o.id}`)} />
      </Card>

      <Card title="Paiements liés à la demande">
        <DataTable columns={paiementCols} rows={paiements.data} getRowId={(p) => p.id} loading={paiements.isLoading} error={paiements.isError}
          errorMessage="Une erreur est survenue lors du chargement des paiements." emptyMessage="Aucun paiement."
          onRowClick={(p) => navigate(`/paiements/${p.id}`)} />
      </Card>

      {dialog === 'rejeter' && (
        <RejectDialog saving={rejeter.isPending} onClose={() => setDialog(null)}
          onSubmit={(motif) => rejeter.mutate({ demande: d, agentId: profile.id, motif }, {
            onSuccess: (r) => { toast.success('Demande rejetée.'); warnIfNotNotified(r.notified); setDialog(null); },
            onError: onError('Le rejet de la demande a échoué.'),
          })} />
      )}
      {dialog === 'valider' && (
        <ConfirmDialog title="Valider le dossier" confirmLabel="Valider" loading={valider.isPending}
          message={`${regle.avertir ? `⚠ Dossier incomplet (${manques.join(' ; ')}). Vous le validez en tant qu'administrateur. ` : ''}Le candidat pourra régler les frais d'adhésion par MVola depuis l'application. Le compte membre et le numéro d'adhérent seront créés automatiquement par le serveur après paiement confirmé.`}
          onCancel={() => setDialog(null)}
          onConfirm={() => valider.mutate({ demande: d, agentId: profile.id }, {
            onSuccess: (r) => { toast.success('Dossier validé.'); warnIfNotNotified(r.notified); setDialog(null); },
            onError: onError('La validation de la demande a échoué.'),
          })} />
      )}
      <DangerZone target={`le dossier ${d.numero_dossier}`} confirmWord="SUPPRIMER" consequences="Ses pièces justificatives seront aussi supprimées."
        description="Supprime le dossier et ses pièces. Impossible pour une demande validée, ou tant qu'il contient des œuvres ou des paiements."
        onDelete={() => deleteDemande(d.id)} onDone={() => navigate('/demandes')} />
    </div>
  );
}
