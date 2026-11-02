import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as svc from '@/services/candidat.service';
import type { ListParams } from '@/services/helpers';

export const useCandidates = (p: ListParams) =>
  useQuery({ queryKey: ['candidats', 'list', p], queryFn: () => svc.listCandidats(p), placeholderData: keepPreviousData });

export const useCandidate = (id: string) =>
  useQuery({ queryKey: ['candidats', 'detail', id], queryFn: () => svc.getCandidat(id) });

export const useCandidateDemandes = (id: string) =>
  useQuery({ queryKey: ['candidats', 'demandes', id], queryFn: () => svc.listDemandesOfCandidat(id) });

export const useCandidateMembreId = (id: string) =>
  useQuery({ queryKey: ['candidats', 'membre', id], queryFn: () => svc.findMembreIdOfCandidat(id) });

export function useUpdateCandidate(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: svc.CandidatInput) => svc.updateCandidat(id, v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidats'] }),
  });
}
