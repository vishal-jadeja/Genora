import { runs } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { getPostByTriggerRunId } from "@/lib/posts/service";
import type { generatePost } from "@/trigger/generatePost";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/runs/[runId]">,
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { runId } = await ctx.params;

  // A run id alone isn't proof of ownership — Trigger.dev run ids aren't
  // scoped per-user, so without this check any authenticated user could
  // poll any other user's run and read their generation output.
  const post = await getPostByTriggerRunId(userId, runId);
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let run;
  try {
    run = await runs.retrieve<typeof generatePost>(runId);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: run.id,
    status: run.status,
    isCompleted: run.isCompleted,
    isSuccess: run.isSuccess,
    isFailed: run.isFailed,
    output: run.output,
  });
}
