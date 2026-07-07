import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { createPostSchema } from "@/lib/posts/schema";
import { createPost, listPosts } from "@/lib/posts/service";

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folderId =
    new URL(request.url).searchParams.get("folderId") ?? undefined;
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

  const post = await createPost({ userId, ...parsed.data });
  return NextResponse.json(post, { status: 201 });
}
