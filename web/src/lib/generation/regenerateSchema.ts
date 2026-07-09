import { z } from "zod";
import { MODEL_CATALOG, type ModelId } from "./modelCatalog";

const MODEL_IDS = Object.keys(MODEL_CATALOG) as [ModelId, ...ModelId[]];

export const regeneratePlatformSchema = z.object({
  modelId: z.enum(MODEL_IDS).optional(),
});

export type RegeneratePlatformInput = z.infer<typeof regeneratePlatformSchema>;
