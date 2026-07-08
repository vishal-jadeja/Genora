import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { platformInstructions } from "@/db/schema";
import type { Platform } from "@/lib/generation/types";

export interface PlatformInstructionsRecord {
  platform: Platform;
  instructions: string;
  updatedAt: Date;
}

export async function listPlatformInstructions(
  userId: string,
): Promise<PlatformInstructionsRecord[]> {
  return db
    .select({
      platform: platformInstructions.platform,
      instructions: platformInstructions.instructions,
      updatedAt: platformInstructions.updatedAt,
    })
    .from(platformInstructions)
    .where(eq(platformInstructions.userId, userId));
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
