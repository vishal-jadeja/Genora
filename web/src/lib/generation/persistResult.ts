import { and, eq, max, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { platformOutputs, usageLogs } from "@/db/schema";
import type { Provider } from "@/lib/keys/service";
import type { GenerationStage } from "@/lib/aiService/types";
import { calculateCostUsd } from "./pricing";
import type { ModelId } from "./modelCatalog";
import type { Platform } from "./types";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface StageUsageInput {
  stage: GenerationStage;
  promptTokens: number;
  completionTokens: number;
}

interface PersistSuccessInput {
  postId: string;
  userId: string;
  platform: Platform;
  provider: Provider;
  apiModel: string;
  modelId: ModelId;
  content: string;
  revisionCount: number;
  usage: StageUsageInput[];
}

interface PersistFailureInput {
  postId: string;
  userId: string;
  platform: Platform;
  provider: Provider;
  apiModel: string;
  errorReason: string;
}

// Serializes concurrent persistSuccess/persistFailure calls for the same
// post+platform so nextVersion/supersedeCurrent's read-then-write can't race
// under READ COMMITTED — without this, two concurrent generations for the
// same post+platform could both compute the same next version and one insert
// would hit the unique constraint as an unhandled error. Transaction-scoped:
// releases automatically at commit/rollback, no retry loop needed.
async function lockPostPlatform(
  tx: Tx,
  postId: string,
  platform: Platform,
): Promise<void> {
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtext(${postId} || ':' || ${platform}))`,
  );
}

async function nextVersion(
  tx: Tx,
  postId: string,
  platform: Platform,
): Promise<number> {
  const [row] = await tx
    .select({ maxVersion: max(platformOutputs.version) })
    .from(platformOutputs)
    .where(
      and(
        eq(platformOutputs.postId, postId),
        eq(platformOutputs.platform, platform),
      ),
    );
  return (row?.maxVersion ?? 0) + 1;
}

async function supersedeCurrent(
  tx: Tx,
  postId: string,
  platform: Platform,
): Promise<void> {
  await tx
    .update(platformOutputs)
    .set({ isCurrent: false })
    .where(
      and(
        eq(platformOutputs.postId, postId),
        eq(platformOutputs.platform, platform),
        eq(platformOutputs.isCurrent, true),
      ),
    );
}

export async function persistSuccess(
  input: PersistSuccessInput,
): Promise<void> {
  await db.transaction(async (tx) => {
    await lockPostPlatform(tx, input.postId, input.platform);
    await supersedeCurrent(tx, input.postId, input.platform);
    const version = await nextVersion(tx, input.postId, input.platform);

    const [output] = await tx
      .insert(platformOutputs)
      .values({
        postId: input.postId,
        platform: input.platform,
        version,
        content: input.content,
        status: "success",
        revisionCount: input.revisionCount,
        provider: input.provider,
        model: input.apiModel,
        isCurrent: true,
      })
      .returning({ id: platformOutputs.id });

    if (input.usage.length > 0) {
      await tx.insert(usageLogs).values(
        input.usage.map((u) => ({
          userId: input.userId,
          postId: input.postId,
          platformOutputId: output.id,
          stage: u.stage,
          provider: input.provider,
          model: input.apiModel,
          promptTokens: u.promptTokens,
          completionTokens: u.completionTokens,
          totalTokens: u.promptTokens + u.completionTokens,
          costUsd: calculateCostUsd(
            input.modelId,
            u.promptTokens,
            u.completionTokens,
          ).toFixed(6),
        })),
      );
    }
  });
}

export async function persistFailure(
  input: PersistFailureInput,
): Promise<void> {
  await db.transaction(async (tx) => {
    await lockPostPlatform(tx, input.postId, input.platform);
    await supersedeCurrent(tx, input.postId, input.platform);
    const version = await nextVersion(tx, input.postId, input.platform);

    await tx.insert(platformOutputs).values({
      postId: input.postId,
      platform: input.platform,
      version,
      status: "failed",
      errorReason: input.errorReason,
      provider: input.provider,
      model: input.apiModel,
      isCurrent: true,
    });
  });
}

export class VersionNotFoundError extends Error {}

export interface PlatformOutputRow {
  id: string;
  platform: Platform;
  version: number;
  content: string | null;
  status: "pending" | "success" | "failed";
  revisionCount: number;
  errorReason: string | null;
  provider: Provider | null;
  model: string | null;
  isCurrent: boolean;
  createdAt: Date;
}

// Restores an older (or failed) version's content as a new current version —
// append-only, same as persistSuccess/persistManualEdit, rather than flipping
// isCurrent onto the old row in place. Reusing the old row's version number
// in place would make the version count (and history list) shrink right
// after a restore, misrepresenting how many real versions exist. Same
// advisory-lock transaction pattern so a restore can't race a concurrent
// generation for the same post+platform.
export async function restoreVersion(
  postId: string,
  platform: Platform,
  version: number,
): Promise<PlatformOutputRow> {
  return db.transaction(async (tx) => {
    await lockPostPlatform(tx, postId, platform);

    const [target] = await tx
      .select()
      .from(platformOutputs)
      .where(
        and(
          eq(platformOutputs.postId, postId),
          eq(platformOutputs.platform, platform),
          eq(platformOutputs.version, version),
        ),
      );

    if (!target) {
      throw new VersionNotFoundError(`${postId}:${platform}:${version}`);
    }

    await supersedeCurrent(tx, postId, platform);
    const newVersion = await nextVersion(tx, postId, platform);

    const [restored] = await tx
      .insert(platformOutputs)
      .values({
        postId,
        platform,
        version: newVersion,
        content: target.content,
        status: target.status,
        revisionCount: target.revisionCount,
        errorReason: target.errorReason,
        provider: target.provider,
        model: target.model,
        isCurrent: true,
      })
      .returning();

    return restored as PlatformOutputRow;
  });
}

interface PersistManualEditInput {
  postId: string;
  platform: Platform;
  content: string;
  provider: Provider | null;
  model: string | null;
  revisionCount: number;
}

// A user manually editing already-generated content — not a new generation,
// but still versioned the same way (append-only, isCurrent flip) so history
// and restore keep working uniformly regardless of how a version was made.
export async function persistManualEdit(
  input: PersistManualEditInput,
): Promise<{ id: string; version: number }> {
  return db.transaction(async (tx) => {
    await lockPostPlatform(tx, input.postId, input.platform);
    await supersedeCurrent(tx, input.postId, input.platform);
    const version = await nextVersion(tx, input.postId, input.platform);

    const [output] = await tx
      .insert(platformOutputs)
      .values({
        postId: input.postId,
        platform: input.platform,
        version,
        content: input.content,
        status: "success",
        revisionCount: input.revisionCount,
        provider: input.provider,
        model: input.model,
        isCurrent: true,
      })
      .returning({ id: platformOutputs.id });

    return { id: output.id, version };
  });
}
