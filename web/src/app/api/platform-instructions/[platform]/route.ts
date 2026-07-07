import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { platformEnum } from "@/db/schema";
import { upsertPlatformInstructionsSchema } from "@/lib/platformInstructions/schema";
import {
  deletePlatformInstructions,
  upsertPlatformInstructions,
} from "@/lib/platformInstructions/service";
import type { Platform } from "@/lib/generation/types";

function isPlatform(value: string): value is Platform {
  return (platformEnum.enumValues as readonly string[]).includes(value);
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/platform-instructions/[platform]">,
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { platform } = await ctx.params;
  if (!isPlatform(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = upsertPlatformInstructionsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await upsertPlatformInstructions(userId, platform, parsed.data.instructions);
  return NextResponse.json({
    platform,
    instructions: parsed.data.instructions,
  });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/platform-instructions/[platform]">,
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { platform } = await ctx.params;
  if (!isPlatform(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  await deletePlatformInstructions(userId, platform);
  return NextResponse.json({ ok: true });
}
