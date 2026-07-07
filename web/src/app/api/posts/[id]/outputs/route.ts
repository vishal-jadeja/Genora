import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { getPostOutputs } from "@/lib/posts/service";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/posts/[id]/outputs">,
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const outputs = await getPostOutputs(userId, id);
  if (!outputs) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(outputs);
}
