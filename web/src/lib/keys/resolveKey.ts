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

// Distinct from a generic thrown error so callers (resolveGenerationKey.ts)
// can tell "this key will never decrypt" (permanent — e.g. ENCRYPTION_KEY
// rotated out from under an old row) apart from a transient DB failure,
// which should still be retried rather than fast-failed.
export class KeyDecryptionError extends Error {}

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
    let apiKey: string;
    try {
      apiKey = decryptSecret({
        encryptedKey: row.encryptedKey,
        iv: row.iv,
        authTag: row.authTag,
      });
    } catch (err) {
      throw new KeyDecryptionError(
        `stored key for ${req.provider} could not be decrypted, please re-add it: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
    void db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, row.id))
      .catch((err: unknown) => {
        console.error("Failed to update api_keys.lastUsedAt", err);
      });
    return { source: "byok", provider: req.provider, apiKey };
  }

  return {
    source: "free-tier",
    provider: req.provider,
    model: FREE_TIER_MODEL_PLACEHOLDER,
    quota: { remaining: null, limit: null, resetAt: null },
  };
}
