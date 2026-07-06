import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { apiKeys } from "@/db/schema";
import { decryptSecret } from "@/lib/crypto/encryption";
import type { Provider } from "./service";

export interface ResolveKeyRequest {
  userId: string;
  provider: Provider;
}

export interface ResolvedByok {
  source: "byok";
  provider: Provider;
  apiKey: string;
}

export interface ResolvedFreeTier {
  source: "free-tier";
  provider: Provider;
  // TODO(Phase 3): concrete free-tier model is not yet decided.
  model: string;
  quota: {
    // TODO(Phase 6): fill these from the Upstash Redis quota counter.
    remaining: number | null;
    limit: number | null;
    resetAt: Date | null;
  };
}

export type ResolvedKey = ResolvedByok | ResolvedFreeTier;

const FREE_TIER_MODEL_PLACEHOLDER = "TBD";

export async function resolveKeyForGeneration(
  req: ResolveKeyRequest,
): Promise<ResolvedKey> {
  const [row] = await db
    .select()
    .from(apiKeys)
    .where(
      and(eq(apiKeys.userId, req.userId), eq(apiKeys.provider, req.provider)),
    );

  if (row) {
    const apiKey = decryptSecret({
      encryptedKey: row.encryptedKey,
      iv: row.iv,
      authTag: row.authTag,
    });
    void db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, row.id));
    return { source: "byok", provider: req.provider, apiKey };
  }

  return {
    source: "free-tier",
    provider: req.provider,
    model: FREE_TIER_MODEL_PLACEHOLDER,
    quota: { remaining: null, limit: null, resetAt: null },
  };
}
