import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { platformEnum, platformInstructions } from "@/db/schema";
import type { Platform } from "@/lib/generation/types";

export interface PlatformInstructionsRecord {
  platform: Platform;
  instructions: string;
  updatedAt: Date | null;
}

export async function listPlatformInstructions(
  userId: string,
): Promise<PlatformInstructionsRecord[]> {
  const rows = await db
    .select({
      platform: platformInstructions.platform,
      instructions: platformInstructions.instructions,
      updatedAt: platformInstructions.updatedAt,
    })
    .from(platformInstructions)
    .where(eq(platformInstructions.userId, userId));

  const byPlatform = new Map(rows.map((row) => [row.platform, row]));

  return platformEnum.enumValues.map(
    (platform) =>
      byPlatform.get(platform) ?? {
        platform,
        instructions: "",
        updatedAt: null,
      },
  );
}

export async function upsertPlatformInstructions(
  userId: string,
  platform: Platform,
  instructions: string,
): Promise<PlatformInstructionsRecord> {
  const [row] = await db
    .insert(platformInstructions)
    .values({ userId, platform, instructions })
    .onConflictDoUpdate({
      target: [platformInstructions.userId, platformInstructions.platform],
      set: { instructions, updatedAt: new Date() },
    })
    .returning({
      platform: platformInstructions.platform,
      instructions: platformInstructions.instructions,
      updatedAt: platformInstructions.updatedAt,
    });
  return row;
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
