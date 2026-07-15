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

// persistFailure itself must never be allowed to escape and fail the parent
// run — same reasoning as the persistSuccess catch below.
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

    // Resolved (and, for free-tier models, quota-consumed) exactly once per
    // platform here — never inside generatePlatformPost, which retries up to
    // 3x and would otherwise re-consume quota per retry. This is plain async
    // work (DB/Redis calls), not a Trigger.dev wait function, so Promise.all
    // is safe here — it's `triggerAndWait`/`batchTriggerAndWait`/`wait.*`
    // specifically that can't be parallelized with Promise.all.
    const keyResolutions = await Promise.all(
      selections.map(async ({ selection, catalogEntry }) => {
        try {
          const generationKey = await resolveGenerationKey(
            payload.userId,
            selection.modelId,
          );
          return { selection, catalogEntry, generationKey, error: null };
        } catch (err) {
          if (err instanceof GenerationKeyError) {
            return { selection, catalogEntry, generationKey: null, error: err };
          }
          throw err;
        }
      }),
    );

    const keyFailures = keyResolutions.filter(
      (r): r is (typeof keyResolutions)[number] & { error: GenerationKeyError } =>
        r.error !== null,
    );
    const readyToTrigger = keyResolutions.filter(
      (
        r,
      ): r is (typeof keyResolutions)[number] & {
        generationKey: NonNullable<(typeof keyResolutions)[number]["generationKey"]>;
      } => r.generationKey !== null,
    );

    for (const failure of keyFailures) {
      await persistFailureSafe(
        {
          postId: payload.postId,
          userId: payload.userId,
          platform: failure.selection.platform,
          provider: failure.catalogEntry.provider,
          apiModel: failure.catalogEntry.apiModel,
          errorReason: failure.error.message,
        },
        payload.correlationId,
      );
    }

    // Fan out with a single batchTriggerAndWait instead of wrapping
    // per-item triggerAndWait calls in Promise.all — Trigger.dev rejects
    // parallel waits ("Parallel waits are not supported"). `.runs` comes
    // back in the same order as the input items, so we zip it back to
    // `readyToTrigger` by index instead of relying on closures.
    const batchResult =
      readyToTrigger.length > 0
        ? await generatePlatformPost.batchTriggerAndWait(
            readyToTrigger.map(({ selection, generationKey }) => {
              const childPayload: GeneratePlatformPostPayload = {
                postId: payload.postId,
                userId: payload.userId,
                platform: selection.platform,
                rawText: payload.rawText,
                modelId: selection.modelId,
                generationKey,
                correlationId: payload.correlationId,
              };
              return { payload: childPayload };
            }),
          )
        : { runs: [] };

    // Persisting is plain async DB work (not a wait function), so
    // Promise.all is fine here.
    const triggeredResults = await Promise.all(
      batchResult.runs.map(async (run, index): Promise<GeneratePostResult> => {
        const { selection, catalogEntry } = readyToTrigger[index];

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
      }),
    );

    const results: GeneratePostResult[] = [
      ...keyFailures.map(
        (f): GeneratePostResult => ({
          platform: f.selection.platform,
          status: "failed",
        }),
      ),
      ...triggeredResults,
    ];

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
