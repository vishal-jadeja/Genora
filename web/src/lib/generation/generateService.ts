import { auth as triggerAuth } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { posts } from "@/db/schema";
import { callAiService } from "@/lib/aiService/client";
import type { SlopGuardResult } from "@/lib/aiService/types";
import { folderBelongsToUser } from "@/lib/folders/service";
import { findModelIdByApiModel, type ModelId } from "./modelCatalog";
import { getPost } from "@/lib/posts/service";
import type { Platform } from "./types";
import {
  generatePost,
  type GeneratePostPlatformSelection,
} from "../../../trigger/generatePost";
import type { GeneratePostInput } from "./schema";

export class FolderNotOwnedError extends Error {}
export class SlopGuardUnavailableError extends Error {}
export class ModelRequiredError extends Error {}

interface TriggeredRun {
  runId: string;
  publicAccessToken: string | null;
}

async function triggerGenerateRun(
  userId: string,
  postId: string,
  rawText: string,
  platforms: GeneratePostPlatformSelection[],
): Promise<TriggeredRun> {
  const handle = await generatePost.trigger(
    { postId, userId, rawText, platforms },
    { tags: [`user:${userId}`] },
  );

  let publicAccessToken: string | null;
  try {
    publicAccessToken = await triggerAuth.createPublicToken({
      scopes: { read: { runs: [handle.id] } },
      expirationTime: "1h",
    });
  } catch (err) {
    // The job is already running server-side at this point — failing the
    // whole request would hide that from the caller. Degrade instead of
    // throwing; the client can still poll GET /api/generate/[runId].
    console.error(`createPublicToken failed for run ${handle.id}`, err);
    publicAccessToken = null;
  }

  return { runId: handle.id, publicAccessToken };
}

export type GenerateOutcome =
  | { status: "rejected"; slopGuard: SlopGuardResult }
  | {
      status: "accepted";
      postId: string;
      runId: string;
      // null if the job was successfully triggered but the realtime-token
      // call itself failed — the job is genuinely running; the client falls
      // back to session-authenticated polling on GET /api/generate/[runId]
      // instead of the Trigger.dev realtime SDK.
      publicAccessToken: string | null;
      slopGuard: SlopGuardResult;
    };

// Runs the synchronous Slop Guard gate; only a hard_reject blocks job
// creation (see backend-plan.md core flow) — soft_nudge still proceeds.
export async function runGenerate(
  userId: string,
  input: GeneratePostInput,
): Promise<GenerateOutcome> {
  if (input.folderId && !(await folderBelongsToUser(userId, input.folderId))) {
    throw new FolderNotOwnedError(input.folderId);
  }

  let slopGuard: SlopGuardResult;
  try {
    slopGuard = await callAiService<SlopGuardResult>("/slop-guard", {
      raw_text: input.rawText,
    });
  } catch (err) {
    throw new SlopGuardUnavailableError(
      err instanceof Error ? err.message : "slop guard call failed",
    );
  }

  if (slopGuard.verdict === "hard_reject") {
    return { status: "rejected", slopGuard };
  }

  const [post] = await db
    .insert(posts)
    .values({
      userId,
      folderId: input.folderId,
      title: input.title,
      rawContent: input.rawText,
      status: "draft",
    })
    .returning({ id: posts.id });

  let triggered: TriggeredRun;
  try {
    triggered = await triggerGenerateRun(
      userId,
      post.id,
      input.rawText,
      input.platforms,
    );
  } catch (err) {
    // No job was ever created for this post — don't leave an orphaned draft
    // row with nothing that will ever generate for it.
    await db.delete(posts).where(eq(posts.id, post.id));
    throw err;
  }

  return {
    status: "accepted",
    postId: post.id,
    runId: triggered.runId,
    publicAccessToken: triggered.publicAccessToken,
    slopGuard,
  };
}

export type RegeneratePlatformOutcome = TriggeredRun;

// Regenerates (or retries) a single platform for an existing post. Reuses
// the same generatePost task/persistence pipeline as a brand-new generation —
// it already versions correctly (append-only, isCurrent flip) for a post
// that's been generated before.
export async function regeneratePlatform(
  userId: string,
  postId: string,
  platform: Platform,
  modelId?: ModelId,
): Promise<RegeneratePlatformOutcome> {
  const post = await getPost(userId, postId);

  let resolvedModelId = modelId;
  if (!resolvedModelId) {
    const current = post.platformOutputs.find((o) => o.platform === platform);
    resolvedModelId = current?.model
      ? findModelIdByApiModel(current.model)
      : undefined;
  }
  if (!resolvedModelId) {
    throw new ModelRequiredError(
      `no modelId given and no prior generation for platform "${platform}" to infer one from`,
    );
  }

  return triggerGenerateRun(userId, postId, post.rawContent, [
    { platform, modelId: resolvedModelId },
  ]);
}
