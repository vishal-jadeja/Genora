import { task, logger, AbortTaskRunError } from "@trigger.dev/sdk";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { posts } from "@/db/schema";
import { persistFailure, persistSuccess } from "@/lib/generation/persistResult";
import {
  getModelCatalogEntry,
  type ModelCatalogEntry,
  type ModelId,
} from "@/lib/generation/modelCatalog";
import {
  GenerationKeyError,
  resolveGenerationKey,
} from "@/lib/generation/resolveGenerationKey";
import type { Platform } from "@/lib/generation/types";
import {
  generatePlatformPost,
  type GeneratePlatformPostPayload,
} from "./generatePlatformPost";

export interface GeneratePostPlatformSelection {
  platform: Platform;
  modelId: ModelId;
}

export interface GeneratePostPayload {
  postId: string;
  userId: string;
  rawText: string;
  platforms: GeneratePostPlatformSelection[];
  correlationId: string;
}

export interface GeneratePostResult {
  platform: Platform;
  status: "success" | "failed";
}

export interface GeneratePostOutput {
  results: GeneratePostResult[];
}

// persistFailure itself must never be allowed to reject the parent
// Promise.all either — same reasoning as the persistSuccess catch above.
async function persistFailureSafe(
  input: Parameters<typeof persistFailure>[0],
  correlationId: string,
): Promise<void> {
  try {
    await persistFailure(input);
  } catch (err) {
    logger.error("persistFailure failed", {
      correlationId,
      postId: input.postId,
      platform: input.platform,
      err,
    });
  }
}

export const generatePost = task({
  id: "generate-post",
  run: async (payload: GeneratePostPayload): Promise<GeneratePostOutput> => {
    // Validated up front, before any fan-out starts, so a bad model id fails
    // the whole run immediately instead of after some platforms already ran.
    const selections: {
      selection: GeneratePostPlatformSelection;
      catalogEntry: ModelCatalogEntry;
    }[] = payload.platforms.map((selection) => {
      const catalogEntry = getModelCatalogEntry(selection.modelId);
      if (!catalogEntry) {
        throw new AbortTaskRunError(`unknown model id: ${selection.modelId}`);
      }
      return { selection, catalogEntry };
    });

    // Fan out with per-item triggerAndWait (not batchTriggerAndWait) so each
    // result is correlated to its platform via closure, not array position —
    // Trigger.dev doesn't document that batch results preserve input order.
    const results = await Promise.all(
      selections.map(
        async ({ selection, catalogEntry }): Promise<GeneratePostResult> => {
          // Resolved (and, for free-tier models, quota-consumed) exactly
          // once here — never inside generatePlatformPost, which retries up
          // to 3x and would otherwise re-consume quota per retry.
          let generationKey;
          try {
            generationKey = await resolveGenerationKey(
              payload.userId,
              selection.modelId,
            );
          } catch (err) {
            if (err instanceof GenerationKeyError) {
              await persistFailureSafe(
                {
                  postId: payload.postId,
                  userId: payload.userId,
                  platform: selection.platform,
                  provider: catalogEntry.provider,
                  apiModel: catalogEntry.apiModel,
                  errorReason: err.message,
                },
                payload.correlationId,
              );
              return { platform: selection.platform, status: "failed" };
            }
            throw err;
          }

          const childPayload: GeneratePlatformPostPayload = {
            postId: payload.postId,
            userId: payload.userId,
            platform: selection.platform,
            rawText: payload.rawText,
            modelId: selection.modelId,
            generationKey,
            correlationId: payload.correlationId,
          };

          const run = await generatePlatformPost.triggerAndWait(childPayload);

          if (run.ok && run.output.status === "success") {
            try {
              await persistSuccess({
                postId: payload.postId,
                userId: payload.userId,
                platform: selection.platform,
                provider: catalogEntry.provider,
                apiModel: catalogEntry.apiModel,
                modelId: catalogEntry.id,
                content: run.output.content,
                revisionCount: run.output.revisionCount,
                usage: run.output.usage,
              });
              return { platform: selection.platform, status: "success" };
            } catch (err) {
              // A persistence failure here must never escape this callback —
              // letting it reject the parent Promise.all would retry the
              // *entire* run, including platforms that already succeeded and
              // paid for a real generation. Degrade to a recorded failure
              // for this platform only.
              logger.error("persistSuccess failed", {
                correlationId: payload.correlationId,
                postId: payload.postId,
                platform: selection.platform,
                err,
              });
              await persistFailureSafe(
                {
                  postId: payload.postId,
                  userId: payload.userId,
                  platform: selection.platform,
                  provider: catalogEntry.provider,
                  apiModel: catalogEntry.apiModel,
                  errorReason: `generation succeeded but result could not be saved: ${
                    err instanceof Error ? err.message : String(err)
                  }`,
                },
                payload.correlationId,
              );
              return { platform: selection.platform, status: "failed" };
            }
          }

          const errorReason = !run.ok
            ? run.error instanceof Error
              ? run.error.message
              : String(run.error)
            : run.output.status === "failed"
              ? run.output.errorReason
              : "unknown generation failure";

          await persistFailureSafe(
            {
              postId: payload.postId,
              userId: payload.userId,
              platform: selection.platform,
              provider: catalogEntry.provider,
              apiModel: catalogEntry.apiModel,
              errorReason,
            },
            payload.correlationId,
          );
          return { platform: selection.platform, status: "failed" };
        },
      ),
    );

    // Only flip status forward from "draft" — a post the user has since
    // edited or exported shouldn't be silently reset by a later generation.
    if (results.some((r) => r.status === "success")) {
      await db
        .update(posts)
        .set({ status: "generated", updatedAt: new Date() })
        .where(and(eq(posts.id, payload.postId), eq(posts.status, "draft")));
    }

    return { results };
  },
});
