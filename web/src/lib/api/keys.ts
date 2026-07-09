import type { ApiKeyStatus, Provider } from "@/lib/keys/service";
import type { AddApiKeyInput } from "@/lib/keys/schema";
import { api } from "./http";

export function listApiKeys(): Promise<ApiKeyStatus[]> {
  return api.get<ApiKeyStatus[]>("/api/keys");
}

export function saveApiKey(input: AddApiKeyInput): Promise<ApiKeyStatus> {
  return api.post<ApiKeyStatus>("/api/keys", input);
}

export function deleteApiKey(provider: Provider): Promise<{ ok: true }> {
  return api.delete<{ ok: true }>(`/api/keys/${provider}`);
}
