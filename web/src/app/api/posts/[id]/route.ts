import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import {
  deletePost,
  FolderNotOwnedError,
  getPost,
  PostNotFoundError,
  updatePost,
} from "@/lib/posts/service";
import { updatePostSchema } from "@/lib/posts/schema";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/posts/[id]">,
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const post = await getPost(userId, id);
    return NextResponse.json(post);
  } catch (err) {
    if (err instanceof PostNotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw err;
  }
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/posts/[id]">,
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

  const parsed = updatePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id } = await ctx.params;

  try {
    const post = await updatePost(userId, id, parsed.data);
    return NextResponse.json(post);
  } catch (err) {
    if (err instanceof PostNotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (err instanceof FolderNotOwnedError) {
      return NextResponse.json(
        { error: "folderId does not belong to this user" },
        { status: 400 },
      );
    }
    throw err;
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/posts/[id]">,
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  await deletePost(userId, id);
  return NextResponse.json({ ok: true });
}
