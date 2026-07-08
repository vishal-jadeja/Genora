import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { getRunStatus, RunAccessError } from "@/lib/generation/runStatus";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/generate/[runId]">,
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { runId } = await ctx.params;

  try {
    const status = await getRunStatus(userId, runId);
    return NextResponse.json(status);
  } catch (err) {
    if (err instanceof RunAccessError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw err;
  }
}
