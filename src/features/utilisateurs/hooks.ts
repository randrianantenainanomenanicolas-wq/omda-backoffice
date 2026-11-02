import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as svc from '@/services/utilisateur.service';

export const useUsers = (p: svc.UtilisateurListParams) =>
  useQuery({ queryKey: ['utilisateurs', 'list', p], queryFn: () => svc.listUtilisateurs(p), placeholderData: keepPreviousData });

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: svc.UtilisateurInput }) => svc.updateUtilisateur(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['utilisateurs'] }),
  });
}
