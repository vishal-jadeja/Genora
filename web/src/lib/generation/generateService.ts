import { auth as triggerAuth } from "@trigger.dev/sdk";
import { db } from "@/db/client";
import { posts } from "@/db/schema";
import { callAiService } from "@/lib/aiService/client";
import type { SlopGuardResult } from "@/lib/aiService/types";
import { folderBelongsToUser } from "@/lib/folders/service";
import { generatePost } from "../../../trigger/generatePost";
import type { GeneratePostInput } from "./schema";

export class FolderNotOwnedError extends Error {}
export class SlopGuardUnavailableError extends Error {}

export type GenerateOutcome =
  | { status: "rejected"; slopGuard: SlopGuardResult }
  | {
      status: "accepted";
      postId: string;
      runId: string;
      publicAccessToken: string;
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

  const handle = await generatePost.trigger(
    {
      postId: post.id,
      userId,
      rawText: input.rawText,
      platforms: input.platforms,
    },
    { tags: [`user:${userId}`] },
  );

  const publicAccessToken = await triggerAuth.createPublicToken({
    scopes: { read: { runs: [handle.id] } },
    expirationTime: "1h",
  });

  return {
    status: "accepted",
    postId: post.id,
    runId: handle.id,
    publicAccessToken,
    slopGuard,
  };
}
