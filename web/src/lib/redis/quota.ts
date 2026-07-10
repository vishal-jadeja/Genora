import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./client";

// Free-tier generations allowed per user per rolling 30-day window. Only
// consumed by free-model (groq/gemini) platform generations that fall back to
// the platform-owned key — see resolveGenerationKey.ts. A BYOK key for that
// provider bypasses this entirely.
export const FREE_TIER_MONTHLY_LIMIT = 30;

const quotaLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(FREE_TIER_MONTHLY_LIMIT, "30 d"),
  prefix: "genora:quota",
});

export interface QuotaStatus {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
}

// Consumes one unit of free-tier quota for this user. Call only at the point
// a free-tier generation is actually about to run (resolveGenerationKey.ts),
// not for display — use peekQuota for that.
export async function consumeQuota(userId: string): Promise<QuotaStatus> {
  const { success, remaining, limit, reset } = await quotaLimiter.limit(userId);
  return { allowed: success, remaining, limit, resetAt: new Date(reset) };
}

// Non-consuming read of the current quota state, for display (GET /api/quota,
// dashboard/settings banners).
export async function peekQuota(userId: string): Promise<QuotaStatus> {
  const { remaining, limit, reset } = await quotaLimiter.getRemaining(userId);
  return { allowed: remaining > 0, remaining, limit, resetAt: new Date(reset) };
}
