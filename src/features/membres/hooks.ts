import { keepPreviousData, useQuery } from '@tanstack/react-query';
import * as svc from '@/services/membre.service';
import { listCategories } from '@/services/categorie.service';

export const useMembers = (p: svc.MembreListParams) =>
  useQuery({ queryKey: ['membres', 'list', p], queryFn: () => svc.listMembres(p), placeholderData: keepPreviousData });

export const useMember = (id: string) =>
  useQuery({ queryKey: ['membres', 'detail', id], queryFn: () => svc.getMembre(id) });

export const useMemberDossier = (id: string) =>
  useQuery({ queryKey: ['membres', 'dossier', id], queryFn: () => svc.getMembreDossier(id) });

export const useCategories = () =>
  useQuery({ queryKey: ['categories', 'ref'], queryFn: listCategories, staleTime: 5 * 60_000 });
