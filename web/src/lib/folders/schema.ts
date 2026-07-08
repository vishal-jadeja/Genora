import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().min(1).max(100),
});

export const renameFolderSchema = z.object({
  name: z.string().min(1).max(100),
});
