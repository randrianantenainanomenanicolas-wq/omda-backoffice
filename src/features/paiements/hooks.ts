import { keepPreviousData, useQuery } from '@tanstack/react-query';
import * as svc from '@/services/paiement.service';

export const usePaiements = (p: svc.PaiementListParams) =>
  useQuery({ queryKey: ['paiements', 'list', p], queryFn: () => svc.listPaiements(p), placeholderData: keepPreviousData });
export const usePaiement = (id: string) =>
  useQuery({ queryKey: ['paiements', 'detail', id], queryFn: () => svc.getPaiement(id) });
export const useJournal = (id: string) =>
  useQuery({ queryKey: ['paiements', 'journal', id], queryFn: () => svc.listJournal(id) });
