import { z } from "zod";

export const upsertPlatformInstructionsSchema = z.object({
  instructions: z.string().min(1).max(10_000),
});

export type UpsertPlatformInstructionsInput = z.infer<
  typeof upsertPlatformInstructionsSchema
>;
