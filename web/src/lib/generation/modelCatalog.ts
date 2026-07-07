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
  sonnet: {
    id: "sonnet",
    provider: "anthropic",
    apiModel: "claude-sonnet-4-5",
    free: true,
  },
  opus: {
    id: "opus",
    provider: "anthropic",
    apiModel: "claude-opus-4-1",
    free: false,
  },
  gpt5: { id: "gpt5", provider: "openai", apiModel: "gpt-5", free: false },
  gemini: {
    id: "gemini",
    provider: "gemini",
    apiModel: "gemini-2.5-pro",
    free: false,
  },
  groq: {
    id: "groq",
    provider: "groq",
    apiModel: "llama-3.3-70b-versatile",
    free: false,
  },
};

export function getModelCatalogEntry(
  modelId: string,
): ModelCatalogEntry | undefined {
  return MODEL_CATALOG[modelId as ModelId];
}
