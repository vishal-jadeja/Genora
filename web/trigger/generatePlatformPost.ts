import { task } from "@trigger.dev/sdk";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { platformInstructions } from "@/db/schema";
import { AiServiceError, callAiService } from "@/lib/aiService/client";
import type {
  GenerateRequest,
  GenerateResponse,
  RagRetrieveResponse,
} from "@/lib/aiService/types";
import type { ModelId } from "@/lib/generation/modelCatalog";
import type { GenerationKey } from "@/lib/generation/resolveGenerationKey";
import type { Platform } from "@/lib/generation/types";

export interface GeneratePlatformPostPayload {
  postId: string;
  userId: string;
  platform: Platform;
  rawText: string;
  modelId: ModelId;
  // Resolved (and, for free-tier models, quota-consumed) once by the parent
  // generatePost task before fan-out — never re-resolved here, since this
  // task's automatic retries would otherwise re-consume free-tier quota for
  // the same logical attempt on every transient failure.
  generationKey: GenerationKey;
}

export interface StageUsageOutput {
  stage: "writer" | "critic" | "reviser";
  promptTokens: number;
  completionTokens: number;
}

export type GeneratePlatformPostOutput =
  | {
      status: "success";
      content: string;
      revisionCount: number;
      usage: StageUsageOutput[];
    }
  | { status: "failed"; errorReason: string };

export const generatePlatformPost = task({
  id: "generate-platform-post",
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10_000,
    factor: 2,
  },
  run: async (
    payload: GeneratePlatformPostPayload,
  ): Promise<GeneratePlatformPostOutput> => {
    const generationKey = payload.generationKey;

    const [instructionsRow] = await db
      .select({ instructions: platformInstructions.instructions })
      .from(platformInstructions)
      .where(
        and(
          eq(platformInstructions.userId, payload.userId),
          eq(platformInstructions.platform, payload.platform),
        ),
      );

    let ragContext: string[] = [];
    try {
      const ragResult = await callAiService<RagRetrieveResponse>(
        "/rag/retrieve",
        {
          user_id: payload.userId,
          query_text: payload.rawText,
          limit: 5,
        },
      );
      ragContext = ragResult.matches.map((m) => m.content);
    } catch {
      // RAG is a quality enhancement, not a hard dependency — a flaky
      // embedding call shouldn't sink an otherwise-good generation.
      ragContext = [];
    }

    const generateRequest: GenerateRequest = {
      raw_text: payload.rawText,
      platform: payload.platform,
      platform_instructions: instructionsRow?.instructions ?? "",
      rag_context: ragContext,
      provider: generationKey.provider,
      api_key: generationKey.apiKey,
      model: generationKey.apiModel,
    };

    let result: GenerateResponse;
    try {
      // /generate can run up to 5 sequential LLM calls (writer + up to 2
      // rounds of critic+reviser) — the 15s client default is sized for a
      // single-shot call like /slop-guard, not this pipeline.
      result = await callAiService<GenerateResponse>(
        "/generate",
        generateRequest,
        { timeoutMs: 90_000 },
      );
    } catch (err) {
      if (err instanceof AiServiceError && err.status === 429) {
        // Rate limit — free-tier models share a platform-owned key across
        // all users, so this is expected under load, not permanent. Rethrow
        // so the task's existing retry/backoff applies.
        throw err;
      }
      if (err instanceof AiServiceError && err.status < 500) {
        // Bad request / invalid model / provider auth failure — retrying
        // would just fail the same way again.
        return { status: "failed", errorReason: err.message };
      }
      // Network error or 5xx — rethrow so the task's retry/backoff applies.
      throw err;
    }

    return {
      status: "success",
      content: result.content,
      revisionCount: result.revision_count,
      usage: result.usage.map((u) => ({
        stage: u.stage,
        promptTokens: u.prompt_tokens,
        completionTokens: u.completion_tokens,
      })),
    };
  },
});
