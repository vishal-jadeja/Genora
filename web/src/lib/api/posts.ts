import type { PostDetail, PostSummary } from "@/lib/posts/service";
import type { CreatePostInput, UpdatePostInput } from "@/lib/posts/schema";
import { api } from "./http";

export function listPosts(folderId?: string): Promise<PostSummary[]> {
  const qs = folderId ? `?folderId=${encodeURIComponent(folderId)}` : "";
  return api.get<PostSummary[]>(`/api/posts${qs}`);
}

export function createPost(input: CreatePostInput): Promise<PostSummary> {
  return api.post<PostSummary>("/api/posts", input);
}

export function getPost(id: string): Promise<PostDetail> {
  return api.get<PostDetail>(`/api/posts/${id}`);
}

export function updatePost(
  id: string,
  input: UpdatePostInput,
): Promise<PostSummary> {
  return api.patch<PostSummary>(`/api/posts/${id}`, input);
}

export function deletePost(id: string): Promise<{ ok: true }> {
  return api.delete<{ ok: true }>(`/api/posts/${id}`);
}
