import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFolder,
  deleteFolder,
  listFolders,
  renameFolder,
} from "@/lib/api/folders";
import { foldersKey, postsRootKey } from "./queryKeys";

export function useFolders() {
  return useQuery({ queryKey: foldersKey, queryFn: listFolders });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foldersKey });
    },
  });
}

export function useRenameFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      renameFolder(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foldersKey });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foldersKey });
      // Posts filed under the deleted folder move to folderId: null.
      queryClient.invalidateQueries({ queryKey: postsRootKey });
    },
  });
}
