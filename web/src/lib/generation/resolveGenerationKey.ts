import { resolveKeyForGeneration } from "@/lib/keys/resolveKey";
import { getModelCatalogEntry, type ModelId } from "./modelCatalog";
import type { Provider } from "@/lib/keys/service";

export class GenerationKeyError extends Error {}

export interface GenerationKey {
  provider: Provider;
  apiModel: string;
  apiKey: string;
}

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

  const platformKey = process.env.PLATFORM_ANTHROPIC_API_KEY;
  if (!platformKey) {
    throw new GenerationKeyError(
      "PLATFORM_ANTHROPIC_API_KEY is not configured",
    );
  }

  return {
    provider: entry.provider,
    apiModel: entry.apiModel,
    apiKey: platformKey,
  };
}
