import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteApiKey, listApiKeys, saveApiKey } from "@/lib/api/keys";
import { apiKeysKey } from "./queryKeys";

export function useApiKeys() {
  return useQuery({ queryKey: apiKeysKey, queryFn: listApiKeys });
}

export function useSaveKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeysKey });
    },
  });
}

export function useDeleteKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeysKey });
    },
  });
}
