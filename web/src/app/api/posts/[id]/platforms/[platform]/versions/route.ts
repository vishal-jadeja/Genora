import { NextResponse } from "next/server";
import { platformEnum } from "@/db/schema";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import type { Platform } from "@/lib/generation/types";
import { listPlatformOutputVersions, PostNotFoundError } from "@/lib/posts/service";

function isPlatform(value: string): value is Platform {
  return (platformEnum.enumValues as readonly string[]).includes(value);
}

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/posts/[id]/platforms/[platform]/versions">,
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, platform } = await ctx.params;
  if (!isPlatform(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  try {
    const versions = await listPlatformOutputVersions(userId, id, platform);
    return NextResponse.json(versions);
  } catch (err) {
    if (err instanceof PostNotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw err;
  }
}
