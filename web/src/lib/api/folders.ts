import type { FolderRecord } from "@/lib/folders/service";
import type { CreateFolderInput, RenameFolderInput } from "@/lib/folders/schema";
import { api } from "./http";

export function listFolders(): Promise<FolderRecord[]> {
  return api.get<FolderRecord[]>("/api/folders");
}

export function createFolder(input: CreateFolderInput): Promise<FolderRecord> {
  return api.post<FolderRecord>("/api/folders", input);
}

export function renameFolder(
  id: string,
  input: RenameFolderInput,
): Promise<FolderRecord> {
  return api.patch<FolderRecord>(`/api/folders/${id}`, input);
}

export function deleteFolder(id: string): Promise<{ ok: true }> {
  return api.delete<{ ok: true }>(`/api/folders/${id}`);
}
