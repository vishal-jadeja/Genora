import { and, eq, max } from "drizzle-orm";
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
