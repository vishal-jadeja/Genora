import { z } from "zod";

export const editPlatformOutputSchema = z.object({
  content: z.string().min(1).max(20_000),
});

export type EditPlatformOutputInput = z.infer<typeof editPlatformOutputSchema>;
