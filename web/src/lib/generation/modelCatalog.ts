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
  // Free tier: Gemini 2.5 Flash (not Pro) to stay within free-tier rate
  // limits, and Groq — both use a platform-owned key (resolveGenerationKey).
  gemini: {
    id: "gemini",
    provider: "gemini",
    apiModel: "gemini-2.5-flash",
    free: true,
  },
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
