import { api } from "./http";

// Mirrors QuotaStatus in @/lib/redis/quota, but resetAt arrives as an ISO
// string over the wire, not a Date.
export interface QuotaStatusResponse {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: string;
}

export function getQuota(): Promise<QuotaStatusResponse> {
  return api.get<QuotaStatusResponse>("/api/quota");
}
