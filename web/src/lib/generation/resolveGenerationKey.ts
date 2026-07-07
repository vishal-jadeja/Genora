import { resolveKeyForGeneration } from "@/lib/keys/resolveKey";
import { getModelCatalogEntry, type ModelId } from "./modelCatalog";
import type { Provider } from "@/lib/keys/service";

export class GenerationKeyError extends Error {}

export interface GenerationKey {
  provider: Provider;
  apiModel: string;
  apiKey: string;
}

// Platform-owned keys backing the free-tier models (see modelCatalog.ts).
// No Anthropic entry — Anthropic models are BYOK-only.
const PLATFORM_KEY_ENV_VAR: Partial<Record<Provider, string>> = {
  groq: "PLATFORM_GROQ_API_KEY",
  gemini: "PLATFORM_GEMINI_API_KEY",
};

/**
 * Resolves which key + model string to send to ai-service for a given
 * (user, model) pair: the user's own BYOK key if they've added one for that
 * model's provider, otherwise the platform-owned key — but only for models
 * marked `free` in the catalog. A paid model with no BYOK key is a hard
 * error, not a silent fallback.
 */
export async function resolveGenerationKey(
  userId: string,
  modelId: ModelId,
): Promise<GenerationKey> {
  const entry = getModelCatalogEntry(modelId);
  if (!entry) {
    throw new GenerationKeyError(`unknown model id: ${modelId}`);
  }

  const resolved = await resolveKeyForGeneration({
    userId,
    provider: entry.provider,
  });

  if (resolved.source === "byok") {
    return {
      provider: entry.provider,
      apiModel: entry.apiModel,
      apiKey: resolved.apiKey,
    };
  }

  if (!entry.free) {
    throw new GenerationKeyError(
      `model "${modelId}" requires a BYOK ${entry.provider} key`,
    );
  }

  const envVar = PLATFORM_KEY_ENV_VAR[entry.provider];
  if (!envVar) {
    throw new GenerationKeyError(
      `no platform-owned key configured for free provider "${entry.provider}"`,
    );
  }

  const platformKey = process.env[envVar];
  if (!platformKey) {
    throw new GenerationKeyError(`${envVar} is not configured`);
  }

  return {
    provider: entry.provider,
    apiModel: entry.apiModel,
    apiKey: platformKey,
  };
}
