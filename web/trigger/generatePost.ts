import { task, AbortTaskRunError } from "@trigger.dev/sdk";
import { persistFailure, persistSuccess } from "@/lib/generation/persistResult";
import {
  getModelCatalogEntry,
  type ModelCatalogEntry,
  type ModelId,
} from "@/lib/generation/modelCatalog";
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
}

export interface GeneratePostResult {
  platform: Platform;
  status: "success" | "failed";
}

export interface GeneratePostOutput {
  results: GeneratePostResult[];
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
          const childPayload: GeneratePlatformPostPayload = {
            postId: payload.postId,
            userId: payload.userId,
            platform: selection.platform,
            rawText: payload.rawText,
            modelId: selection.modelId,
          };

          const run = await generatePlatformPost.triggerAndWait(childPayload);

          if (run.ok && run.output.status === "success") {
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
          }

          const errorReason = !run.ok
            ? run.error instanceof Error
              ? run.error.message
              : String(run.error)
            : run.output.status === "failed"
              ? run.output.errorReason
              : "unknown generation failure";

          await persistFailure({
            postId: payload.postId,
            userId: payload.userId,
            platform: selection.platform,
            provider: catalogEntry.provider,
            apiModel: catalogEntry.apiModel,
            errorReason,
          });
          return { platform: selection.platform, status: "failed" };
        },
      ),
    );

    return { results };
  },
});
