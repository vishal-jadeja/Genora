import { z } from "zod";
import { postStatusEnum } from "@/db/schema";

export const createPostSchema = z.object({
  rawContent: z.string().min(1).max(20_000),
  title: z.string().max(200).optional(),
  folderId: z.string().uuid().optional(),
});

export const updatePostSchema = z.object({
  title: z.string().max(200).optional(),
  rawContent: z.string().min(1).max(20_000).optional(),
  folderId: z.string().uuid().nullable().optional(),
  status: z.enum(postStatusEnum.enumValues).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
