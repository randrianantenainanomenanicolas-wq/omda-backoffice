import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as svc from '@/services/categorieDemandee.service';
import type { CategorieDemandeeRow } from '@/types/models';

export const useCategoriesDemandees = (p: svc.CategorieDemandeeParams) =>
  useQuery({ queryKey: ['categories-demandees', 'list', p], queryFn: () => svc.listCategoriesDemandees(p), placeholderData: keepPreviousData });

export const useOeuvresCategorie = (membreId: string | undefined, categorieId: string | undefined) =>
  useQuery({
    queryKey: ['categories-demandees', 'oeuvres', membreId, categorieId],
    queryFn: () => svc.listOeuvresDuMembreDansCategorie(membreId!, categorieId!),
    enabled: !!membreId && !!categorieId,
  });

export function useDecideCategorie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { row: CategorieDemandeeRow; accepter: boolean }) => svc.decideCategorie(v.row, v.accepter),
    onSuccess: () => Promise.all(['categories-demandees', 'membres', 'dashboard', 'notifications'].map((k) => qc.invalidateQueries({ queryKey: [k] }))),
  });
}
