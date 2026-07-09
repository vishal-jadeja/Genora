import { NextResponse } from "next/server";
import { platformEnum } from "@/db/schema";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import type { Platform } from "@/lib/generation/types";
import {
  PostNotFoundError,
  restorePlatformOutputVersion,
  VersionNotFoundError,
} from "@/lib/posts/service";

function isPlatform(value: string): value is Platform {
  return (platformEnum.enumValues as readonly string[]).includes(value);
}

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/posts/[id]/platforms/[platform]/versions/[version]/restore">,
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, platform, version } = await ctx.params;
  if (!isPlatform(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  const versionNumber = Number(version);
  if (!Number.isInteger(versionNumber) || versionNumber < 1) {
    return NextResponse.json({ error: "Invalid version" }, { status: 400 });
  }

  try {
    const restored = await restorePlatformOutputVersion(
      userId,
      id,
      platform,
      versionNumber,
    );
    return NextResponse.json(restored);
  } catch (err) {
    if (err instanceof PostNotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (err instanceof VersionNotFoundError) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }
    throw err;
  }
}
