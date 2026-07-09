import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPost,
  deletePost,
  getPost,
  listPosts,
  updatePost,
} from "@/lib/api/posts";
import type { UpdatePostInput } from "@/lib/posts/schema";
import { postDetailKey, postsListKey, postsRootKey } from "./queryKeys";

export function usePosts(folderId?: string) {
  return useQuery({
    queryKey: postsListKey(folderId),
    queryFn: () => listPosts(folderId),
  });
}

export function usePost(id: string | undefined) {
  return useQuery({
    queryKey: postDetailKey(id ?? ""),
    queryFn: () => getPost(id as string),
    enabled: !!id,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsRootKey });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePostInput }) =>
      updatePost(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsRootKey });
    },
  });
}

export function useMovePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, folderId }: { id: string; folderId: string | null }) =>
      updatePost(id, { folderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsRootKey });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsRootKey });
    },
  });
}

// No dedicated duplicate endpoint exists — composes a read + a create.
// Per the wiring plan, this intentionally does NOT copy generated
// per-platform outputs; the duplicate starts as a fresh draft.
export function useDuplicatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const source = await getPost(id);
      return createPost({
        rawContent: source.rawContent,
        title: source.title ?? undefined,
        folderId: source.folderId ?? undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsRootKey });
    },
  });
}
