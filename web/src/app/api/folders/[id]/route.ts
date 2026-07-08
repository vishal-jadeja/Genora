import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import {
  deleteFolder,
  FolderNameTakenError,
  FolderNotFoundError,
  renameFolder,
} from "@/lib/folders/service";
import { renameFolderSchema } from "@/lib/folders/schema";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/folders/[id]">,
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = renameFolderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id } = await ctx.params;

  try {
    const folder = await renameFolder(userId, id, parsed.data.name);
    return NextResponse.json(folder);
  } catch (err) {
    if (err instanceof FolderNotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (err instanceof FolderNameTakenError) {
      return NextResponse.json(
        { error: "A folder with this name already exists" },
        { status: 409 },
      );
    }
    throw err;
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/folders/[id]">,
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    await deleteFolder(userId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof FolderNotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw err;
  }
}
