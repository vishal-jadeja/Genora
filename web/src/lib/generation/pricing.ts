import type { ModelId } from "./modelCatalog";

// Approximate list prices in USD per 1M tokens, captured when this catalog
// was authored. Not fetched live and will drift — confirm against each
// provider's current pricing page before relying on this for real billing.
const PRICING_PER_MILLION_TOKENS: Record<
  ModelId,
  { prompt: number; completion: number }
> = {
  sonnet: { prompt: 3, completion: 15 },
  opus: { prompt: 15, completion: 75 },
  gpt5: { prompt: 5, completion: 15 },
  gemini: { prompt: 1.25, completion: 10 },
  groq: { prompt: 0.59, completion: 0.79 },
};

export function calculateCostUsd(
  modelId: ModelId,
  promptTokens: number,
  completionTokens: number,
): number {
  const pricing = PRICING_PER_MILLION_TOKENS[modelId];
  return (
    (promptTokens / 1_000_000) * pricing.prompt +
    (completionTokens / 1_000_000) * pricing.completion
  );
}
