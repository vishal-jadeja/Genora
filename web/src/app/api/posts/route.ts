import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import {
  createPost,
  FolderNotOwnedError,
  listPosts,
} from "@/lib/posts/service";
import { createPostSchema } from "@/lib/posts/schema";

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folderId") ?? undefined;

  const posts = await listPosts(userId, folderId);
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
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

  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const post = await createPost(userId, parsed.data);
    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    if (err instanceof FolderNotOwnedError) {
      return NextResponse.json(
        { error: "folderId does not belong to this user" },
        { status: 400 },
      );
    }
    throw err;
  }
}
