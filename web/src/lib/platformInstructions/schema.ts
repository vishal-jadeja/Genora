import { z } from "zod";

export const upsertPlatformInstructionsSchema = z.object({
  instructions: z.string().max(5_000),
});

export type UpsertPlatformInstructionsInput = z.infer<
  typeof upsertPlatformInstructionsSchema
>;
