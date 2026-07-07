import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { platformEnum, platformInstructions } from "@/db/schema";
import type { Platform } from "@/lib/generation/types";

export interface PlatformInstructionsEntry {
  platform: Platform;
  instructions: string;
}

export async function listPlatformInstructions(
  userId: string,
): Promise<PlatformInstructionsEntry[]> {
  const rows = await db
    .select({
      platform: platformInstructions.platform,
      instructions: platformInstructions.instructions,
    })
    .from(platformInstructions)
    .where(eq(platformInstructions.userId, userId));

  const byPlatform = new Map(
    rows.map((row) => [row.platform, row.instructions]),
  );

  return platformEnum.enumValues.map((platform) => ({
    platform,
    instructions: byPlatform.get(platform) ?? "",
  }));
}

export async function upsertPlatformInstructions(
  userId: string,
  platform: Platform,
  instructions: string,
): Promise<void> {
  await db
    .insert(platformInstructions)
    .values({ userId, platform, instructions })
    .onConflictDoUpdate({
      target: [platformInstructions.userId, platformInstructions.platform],
      set: { instructions, updatedAt: new Date() },
    });
}

export async function deletePlatformInstructions(
  userId: string,
  platform: Platform,
): Promise<void> {
  await db
    .delete(platformInstructions)
    .where(
      and(
        eq(platformInstructions.userId, userId),
        eq(platformInstructions.platform, platform),
      ),
    );
}
