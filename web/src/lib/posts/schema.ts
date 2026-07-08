import { z } from "zod";
import { postStatusEnum } from "@/db/schema";

export const createPostSchema = z.object({
  rawContent: z.string().min(1).max(20_000),
  title: z.string().min(1).optional(),
  folderId: z.string().uuid().optional(),
});

export const updatePostSchema = z
  .object({
    rawContent: z.string().min(1).max(20_000).optional(),
    title: z.string().min(1).nullable().optional(),
    folderId: z.string().uuid().nullable().optional(),
    status: z.enum(postStatusEnum.enumValues).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
