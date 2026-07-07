import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { platformOutputs, postStatusEnum, posts } from "@/db/schema";

export type PostStatus = (typeof postStatusEnum.enumValues)[number];

export interface CreatePostInput {
  userId: string;
  rawContent: string;
  title?: string;
  folderId?: string;
}

export interface UpdatePostInput {
  title?: string;
  rawContent?: string;
  folderId?: string | null;
  status?: PostStatus;
}

export async function createPost(input: CreatePostInput) {
  const [post] = await db
    .insert(posts)
    .values({
      userId: input.userId,
      rawContent: input.rawContent,
      title: input.title,
      folderId: input.folderId,
    })
    .returning();
  return post;
}

export async function listPosts(userId: string, folderId?: string) {
  return db
    .select()
    .from(posts)
    .where(
      folderId
        ? and(eq(posts.userId, userId), eq(posts.folderId, folderId))
        : eq(posts.userId, userId),
    )
    .orderBy(desc(posts.createdAt));
}

export async function getPost(userId: string, postId: string) {
  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)));
  return post ?? null;
}

export async function getPostOutputs(userId: string, postId: string) {
  const post = await getPost(userId, postId);
  if (!post) return null;

  return db
    .select()
    .from(platformOutputs)
    .where(
      and(
        eq(platformOutputs.postId, postId),
        eq(platformOutputs.isCurrent, true),
      ),
    );
}

export async function updatePost(
  userId: string,
  postId: string,
  input: UpdatePostInput,
) {
  const [post] = await db
    .update(posts)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
    .returning();
  return post ?? null;
}

export async function deletePost(
  userId: string,
  postId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
    .returning({ id: posts.id });
  return deleted.length > 0;
}

export async function setPostTriggerRunId(
  postId: string,
  triggerRunId: string,
): Promise<void> {
  await db.update(posts).set({ triggerRunId }).where(eq(posts.id, postId));
}

export async function getPostByTriggerRunId(
  userId: string,
  triggerRunId: string,
) {
  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.triggerRunId, triggerRunId), eq(posts.userId, userId)));
  return post ?? null;
}
