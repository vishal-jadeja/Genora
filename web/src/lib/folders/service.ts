import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { folders } from "@/db/schema";

export async function listFolders(userId: string) {
  return db.select().from(folders).where(eq(folders.userId, userId));
}

export async function createFolder(userId: string, name: string) {
  const [folder] = await db
    .insert(folders)
    .values({ userId, name })
    .returning();
  return folder;
}

export async function renameFolder(
  userId: string,
  folderId: string,
  name: string,
) {
  const [folder] = await db
    .update(folders)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
    .returning();
  return folder ?? null;
}

export async function deleteFolder(
  userId: string,
  folderId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(folders)
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
    .returning({ id: folders.id });
  return deleted.length > 0;
}
