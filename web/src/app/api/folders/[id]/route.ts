import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { renameFolderSchema } from "@/lib/folders/schema";
import { deleteFolder, renameFolder } from "@/lib/folders/service";

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
  const folder = await renameFolder(userId, id, parsed.data.name);
  if (!folder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(folder);
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
  const deleted = await deleteFolder(userId, id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
