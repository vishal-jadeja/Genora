import type { Platform } from "@/lib/generation/types";
import type { Provider } from "@/lib/keys/service";

// Mirrors ai-service/app/schemas/generate.py — keep in sync by hand, there's
// no shared codegen between the TypeScript and Python services.
export interface GenerateRequest {
  raw_text: string;
  platform: Platform;
  platform_instructions: string;
  rag_context: string[];
  provider: Provider;
  api_key: string;
  model: string;
}

export type GenerationStage = "writer" | "critic" | "reviser";

export interface StageUsage {
  stage: GenerationStage;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface GenerateResponse {
  content: string;
  revision_count: number;
  usage: StageUsage[];
}

// Mirrors ai-service/app/schemas/rag.py
export interface RagRetrieveRequest {
  user_id: string;
  query_text: string;
  limit?: number;
}

export interface RagMatch {
  post_id: string | null;
  content: string;
  distance: number;
}

export interface RagRetrieveResponse {
  matches: RagMatch[];
}
