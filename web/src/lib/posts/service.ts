import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { platformOutputs, posts } from "@/db/schema";
import { folderBelongsToUser } from "@/lib/folders/service";

export class PostNotFoundError extends Error {}
export class FolderNotOwnedError extends Error {}

export interface PostSummary {
  id: string;
  folderId: string | null;
  title: string | null;
  rawContent: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformOutputSummary {
  id: string;
  platform: string;
  version: number;
  content: string | null;
  status: string;
  revisionCount: number;
  errorReason: string | null;
  provider: string | null;
  model: string | null;
  createdAt: Date;
}

export interface PostDetail extends PostSummary {
  platformOutputs: PlatformOutputSummary[];
}

export async function listPosts(
  userId: string,
  folderId?: string,
): Promise<PostSummary[]> {
  return db
    .select({
      id: posts.id,
      folderId: posts.folderId,
      title: posts.title,
      rawContent: posts.rawContent,
      status: posts.status,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .where(
      folderId
        ? and(eq(posts.userId, userId), eq(posts.folderId, folderId))
        : eq(posts.userId, userId),
    )
    .orderBy(desc(posts.createdAt));
}

export async function createPost(
  userId: string,
  input: { rawContent: string; title?: string; folderId?: string },
): Promise<PostSummary> {
  if (input.folderId && !(await folderBelongsToUser(userId, input.folderId))) {
    throw new FolderNotOwnedError(input.folderId);
  }

  const [post] = await db
    .insert(posts)
    .values({
      userId,
      rawContent: input.rawContent,
      title: input.title,
      folderId: input.folderId,
    })
    .returning({
      id: posts.id,
      folderId: posts.folderId,
      title: posts.title,
      rawContent: posts.rawContent,
      status: posts.status,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
    });
  return post;
}

export async function getPost(
  userId: string,
  postId: string,
): Promise<PostDetail> {
  const [post] = await db
    .select({
      id: posts.id,
      folderId: posts.folderId,
      title: posts.title,
      rawContent: posts.rawContent,
      status: posts.status,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)));

  if (!post) {
    throw new PostNotFoundError(postId);
  }

  const outputs = await db
    .select({
      id: platformOutputs.id,
      platform: platformOutputs.platform,
      version: platformOutputs.version,
      content: platformOutputs.content,
      status: platformOutputs.status,
      revisionCount: platformOutputs.revisionCount,
      errorReason: platformOutputs.errorReason,
      provider: platformOutputs.provider,
      model: platformOutputs.model,
      createdAt: platformOutputs.createdAt,
    })
    .from(platformOutputs)
    .where(
      and(
        eq(platformOutputs.postId, postId),
        eq(platformOutputs.isCurrent, true),
      ),
    );

  return { ...post, platformOutputs: outputs };
}

export interface UpdatePostInput {
  rawContent?: string;
  title?: string | null;
  folderId?: string | null;
  status?: "draft" | "generated" | "edited" | "exported";
}

export async function updatePost(
  userId: string,
  postId: string,
  input: UpdatePostInput,
): Promise<PostSummary> {
  if (input.folderId && !(await folderBelongsToUser(userId, input.folderId))) {
    throw new FolderNotOwnedError(input.folderId);
  }

  const [post] = await db
    .update(posts)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
    .returning({
      id: posts.id,
      folderId: posts.folderId,
      title: posts.title,
      rawContent: posts.rawContent,
      status: posts.status,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
    });

  if (!post) {
    throw new PostNotFoundError(postId);
  }
  return post;
}

export async function deletePost(
  userId: string,
  postId: string,
): Promise<void> {
  const deleted = await db
    .delete(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
    .returning({ id: posts.id });

  if (deleted.length === 0) {
    throw new PostNotFoundError(postId);
  }
}
