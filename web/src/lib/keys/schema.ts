import { z } from "zod";
import { providerEnum } from "@/db/schema";

export const addApiKeySchema = z.object({
  provider: z.enum(providerEnum.enumValues),
  key: z.string().min(1).max(2000),
  label: z.string().max(200).optional(),
});

export type AddApiKeyInput = z.infer<typeof addApiKeySchema>;
