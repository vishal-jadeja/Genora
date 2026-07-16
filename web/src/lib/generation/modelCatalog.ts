import type { Provider } from "@/lib/keys/service";

export type ModelId = "sonnet" | "opus" | "gpt5" | "gemini" | "groq";

export interface ModelCatalogEntry {
  id: ModelId;
  provider: Provider;
  apiModel: string;
  free: boolean;
}

// Mirrors web/src/lib/genora/data.ts MODELS (the design prototype's model
// list) so the eventual generate UI and this backend agree on ids. No shared
// codegen between them — keep in sync by hand. `apiModel` strings should be
// confirmed against each provider's current model list before going live.
export const MODEL_CATALOG: Record<ModelId, ModelCatalogEntry> = {
  // No platform-owned Anthropic key — both Anthropic models require BYOK.
  sonnet: {
    id: "sonnet",
    provider: "anthropic",
    apiModel: "claude-sonnet-4-5",
    free: false,
  },
  opus: {
    id: "opus",
    provider: "anthropic",
    apiModel: "claude-opus-4-1",
    free: false,
  },
  gpt5: { id: "gpt5", provider: "openai", apiModel: "gpt-5", free: false },
  // Gemini is BYOK-only: the platform-owned Gemini key is not reliable enough
  // on the free tier (provider-side failures), so it's excluded from the
  // free-tier fallback in resolveGenerationKey and requires the user's own
  // Google key.
  gemini: {
    id: "gemini",
    provider: "gemini",
    apiModel: "gemini-2.5-flash",
    free: false,
  },
  // Free tier: Groq only — uses a platform-owned key (resolveGenerationKey).
  // llama-3.3-70b-versatile deprecates on Groq 2026-08-16; using its
  // documented replacement up front rather than shipping a dead model id.
  groq: {
    id: "groq",
    provider: "groq",
    apiModel: "openai/gpt-oss-120b",
    free: true,
  },
};

export function getModelCatalogEntry(
  modelId: string,
): ModelCatalogEntry | undefined {
  return MODEL_CATALOG[modelId as ModelId];
}

// Reverse lookup for regenerating a platform without an explicit modelId:
// platform_outputs.model stores the provider-facing apiModel string, not our
// internal ModelId, so we need to map back to default to "whatever was used
// last time."
export function findModelIdByApiModel(apiModel: string): ModelId | undefined {
  return Object.values(MODEL_CATALOG).find(
    (entry) => entry.apiModel === apiModel,
  )?.id;
}
