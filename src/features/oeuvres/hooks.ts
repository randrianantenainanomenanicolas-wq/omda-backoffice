import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as svc from '@/services/oeuvre.service';
import type { OeuvreDetail } from '@/types/models';

export const useOeuvres = (p: svc.OeuvreListParams) =>
  useQuery({ queryKey: ['oeuvres', 'list', p], queryFn: () => svc.listOeuvres(p), placeholderData: keepPreviousData });
export const useOeuvre = (id: string) =>
  useQuery({ queryKey: ['oeuvres', 'detail', id], queryFn: () => svc.getOeuvre(id) });
export const useAttestations = (id: string) =>
  useQuery({ queryKey: ['oeuvres', 'attestations', id], queryFn: () => svc.listAttestations(id) });
export const useOeuvrePaiements = (id: string) =>
  useQuery({ queryKey: ['oeuvres', 'paiements', id], queryFn: () => svc.listPaiementsOfOeuvre(id) });

function useInvalidate() {
  const qc = useQueryClient();
  return () => Promise.all(['oeuvres', 'dashboard', 'notifications'].map((k) => qc.invalidateQueries({ queryKey: [k] })));
}
export function usePrendreEnCharge() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (v: { id: string; agentId: string }) => svc.prendreEnCharge(v.id, v.agentId), onSettled: inv });
}
export function useValiderOeuvre() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (v: { oeuvre: OeuvreDetail; agentId: string }) => svc.validerOeuvre(v.oeuvre, v.agentId), onSettled: inv });
}
export function useRejeterOeuvre() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (v: { oeuvre: OeuvreDetail; agentId: string; motif: string }) => svc.rejeterOeuvre(v.oeuvre, v.agentId, v.motif),
    onSettled: inv,
  });
}
