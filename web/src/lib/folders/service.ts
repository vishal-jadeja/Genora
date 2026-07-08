import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { folders } from "@/db/schema";

export interface FolderRecord {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Posts reference folders by id alone — callers that accept a folderId from
// the client must check it belongs to the acting user before saving it,
// otherwise a post could be filed under another user's folder.
export async function folderBelongsToUser(
  userId: string,
  folderId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: folders.id })
    .from(folders)
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)));
  return row !== undefined;
}

export async function listFolders(userId: string): Promise<FolderRecord[]> {
  return db
    .select({
      id: folders.id,
      name: folders.name,
      createdAt: folders.createdAt,
      updatedAt: folders.updatedAt,
    })
    .from(folders)
    .where(eq(folders.userId, userId));
}

export class FolderNameTakenError extends Error {}
export class FolderNotFoundError extends Error {}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}

export async function createFolder(
  userId: string,
  name: string,
): Promise<FolderRecord> {
  try {
    const [folder] = await db
      .insert(folders)
      .values({ userId, name })
      .returning({
        id: folders.id,
        name: folders.name,
        createdAt: folders.createdAt,
        updatedAt: folders.updatedAt,
      });
    return folder;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new FolderNameTakenError(name);
    }
    throw err;
  }
}

export async function renameFolder(
  userId: string,
  folderId: string,
  name: string,
): Promise<FolderRecord> {
  let folder: FolderRecord | undefined;
  try {
    [folder] = await db
      .update(folders)
      .set({ name, updatedAt: new Date() })
      .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
      .returning({
        id: folders.id,
        name: folders.name,
        createdAt: folders.createdAt,
        updatedAt: folders.updatedAt,
      });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new FolderNameTakenError(name);
    }
    throw err;
  }

  if (!folder) {
    throw new FolderNotFoundError(folderId);
  }
  return folder;
}

export async function deleteFolder(
  userId: string,
  folderId: string,
): Promise<void> {
  const deleted = await db
    .delete(folders)
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
    .returning({ id: folders.id });

  if (deleted.length === 0) {
    throw new FolderNotFoundError(folderId);
  }
}
