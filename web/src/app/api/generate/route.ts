import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { generateRequestSchema } from "@/lib/generation/schema";
import { checkSlopGuard } from "@/lib/generation/slopGuard";
import { createPost, setPostTriggerRunId } from "@/lib/posts/service";
import { generatePost } from "@/trigger/generatePost";

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

  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { rawText, title, folderId, platforms } = parsed.data;

  // Synchronous, pre-generation gate — runs before any paid model call and
  // before a job (or even a posts row) is created for a rejected input.
  const slopGuard = await checkSlopGuard(rawText);
  if (slopGuard.verdict === "hard_reject") {
    return NextResponse.json(
      { rejected: true, reason: slopGuard.reason },
      { status: 422 },
    );
  }

  const post = await createPost({
    userId,
    rawContent: rawText,
    title,
    folderId,
  });

  const handle = await generatePost.trigger({
    postId: post.id,
    userId,
    rawText,
    platforms,
  });

  await setPostTriggerRunId(post.id, handle.id);

  return NextResponse.json(
    {
      postId: post.id,
      runId: handle.id,
      slopGuard,
    },
    { status: 202 },
  );
}
