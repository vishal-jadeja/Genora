import { z } from "zod";
import { platformEnum } from "@/db/schema";

// Keep in sync by hand with ModelId in modelCatalog.ts.
const modelIdSchema = z.enum(["sonnet", "opus", "gpt5", "gemini", "groq"]);

export const generateRequestSchema = z.object({
  rawText: z.string().min(1).max(20_000),
  title: z.string().max(200).optional(),
  folderId: z.string().uuid().optional(),
  platforms: z
    .array(
      z.object({
        platform: z.enum(platformEnum.enumValues),
        modelId: modelIdSchema,
      }),
    )
    .min(1),
});

export type GenerateRequestInput = z.infer<typeof generateRequestSchema>;
