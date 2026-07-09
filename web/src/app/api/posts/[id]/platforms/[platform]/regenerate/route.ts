import { NextResponse } from "next/server";
import { platformEnum } from "@/db/schema";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import {
  ModelRequiredError,
  regeneratePlatform,
} from "@/lib/generation/generateService";
import { regeneratePlatformSchema } from "@/lib/generation/regenerateSchema";
import type { Platform } from "@/lib/generation/types";
import { PostNotFoundError } from "@/lib/posts/service";

function isPlatform(value: string): value is Platform {
  return (platformEnum.enumValues as readonly string[]).includes(value);
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/posts/[id]/platforms/[platform]/regenerate">,
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, platform } = await ctx.params;
  if (!isPlatform(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  let body: unknown = {};
  const rawBody = await request.text();
  if (rawBody.length > 0) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  }

  const parsed = regeneratePlatformSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { runId, publicAccessToken } = await regeneratePlatform(
      userId,
      id,
      platform,
      parsed.data.modelId,
    );
    return NextResponse.json({ runId, publicAccessToken }, { status: 202 });
  } catch (err) {
    if (err instanceof PostNotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (err instanceof ModelRequiredError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
