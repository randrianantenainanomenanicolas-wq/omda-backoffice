import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as svc from '@/services/demande.service';
import type { DemandeDetail } from '@/types/models';

export const useDemandes = (p: svc.DemandeListParams) =>
  useQuery({ queryKey: ['demandes', 'list', p], queryFn: () => svc.listDemandes(p), placeholderData: keepPreviousData });

export const useDemande = (id: string) =>
  useQuery({ queryKey: ['demandes', 'detail', id], queryFn: () => svc.getDemande(id) });

export const usePieces = (id: string) =>
  useQuery({ queryKey: ['demandes', 'pieces', id], queryFn: () => svc.listPieces(id) });

export const useOeuvresDossier = (id: string) =>
  useQuery({ queryKey: ['demandes', 'oeuvres', id], queryFn: () => svc.listOeuvresOfDemande(id) });

export const useDemandePaiements = (id: string) =>
  useQuery({ queryKey: ['demandes', 'paiements', id], queryFn: () => svc.listPaiementsOfDemande(id) });

function useInvalidate() {
  const qc = useQueryClient();
  return () => Promise.all(['demandes', 'membres', 'candidats', 'dashboard', 'notifications'].map((k) => qc.invalidateQueries({ queryKey: [k] })));
}

export function usePrendreEnCharge() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (v: { id: string; agentId: string }) => svc.prendreEnCharge(v.id, v.agentId), onSettled: inv });
}
export function useRejeter() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (v: { demande: DemandeDetail; agentId: string; motif: string }) => svc.rejeterDemande(v.demande, v.agentId, v.motif),
    onSettled: inv,
  });
}
export function useValider() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (v: { demande: DemandeDetail; agentId: string }) => svc.validerDemande(v),
    onSettled: inv,
  });
}
