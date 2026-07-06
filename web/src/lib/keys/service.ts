import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { apiKeys, providerEnum } from "@/db/schema";
import { encryptSecret } from "@/lib/crypto/encryption";

export type Provider = (typeof providerEnum.enumValues)[number];

export interface ApiKeyStatus {
  provider: Provider;
  label: string | null;
  lastUsedAt: Date | null;
  connected: boolean;
}

export async function listApiKeys(userId: string): Promise<ApiKeyStatus[]> {
  const rows = await db
    .select({
      provider: apiKeys.provider,
      label: apiKeys.label,
      lastUsedAt: apiKeys.lastUsedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId));

  const byProvider = new Map(rows.map((row) => [row.provider, row]));

  return providerEnum.enumValues.map((provider) => {
    const row = byProvider.get(provider);
    return row
      ? {
          provider,
          label: row.label,
          lastUsedAt: row.lastUsedAt,
          connected: true,
        }
      : { provider, label: null, lastUsedAt: null, connected: false };
  });
}

export async function upsertApiKey(
  userId: string,
  provider: Provider,
  rawKey: string,
  label?: string,
): Promise<void> {
  const { encryptedKey, iv, authTag } = encryptSecret(rawKey);
  await db
    .insert(apiKeys)
    .values({ userId, provider, encryptedKey, iv, authTag, label })
    .onConflictDoUpdate({
      target: [apiKeys.userId, apiKeys.provider],
      set: { encryptedKey, iv, authTag, label },
    });
}

export async function deleteApiKey(
  userId: string,
  provider: Provider,
): Promise<void> {
  await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider)));
}
