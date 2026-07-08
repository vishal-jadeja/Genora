import { z } from "zod";
import { platformEnum } from "@/db/schema";
import { MODEL_CATALOG, type ModelId } from "./modelCatalog";

const MODEL_IDS = Object.keys(MODEL_CATALOG) as [ModelId, ...ModelId[]];
const modelIdEnum = z.enum(MODEL_IDS);

export const generatePostSchema = z.object({
  rawText: z.string().min(1).max(20_000),
  title: z.string().min(1).optional(),
  folderId: z.string().uuid().optional(),
  platforms: z
    .array(
      z.object({
        platform: z.enum(platformEnum.enumValues),
        modelId: modelIdEnum,
      }),
    )
    .min(1)
    .refine(
      (platforms) =>
        new Set(platforms.map((p) => p.platform)).size === platforms.length,
      { message: "Each platform can only be selected once" },
    ),
});

export type GeneratePostInput = z.infer<typeof generatePostSchema>;
