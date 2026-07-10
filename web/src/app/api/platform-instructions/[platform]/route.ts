import { NextResponse } from "next/server";
import { platformEnum } from "@/db/schema";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import type { Platform } from "@/lib/generation/types";
import {
  CORRELATION_HEADER,
  getOrCreateCorrelationId,
} from "@/lib/logging/correlationId";
import { upsertPlatformInstructionsSchema } from "@/lib/platformInstructions/schema";
import {
  deletePlatformInstructions,
  upsertPlatformInstructions,
} from "@/lib/platformInstructions/service";

function isPlatform(value: string): value is Platform {
  return (platformEnum.enumValues as readonly string[]).includes(value);
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/platform-instructions/[platform]">,
) {
  const correlationId = getOrCreateCorrelationId(request);

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  const { platform } = await ctx.params;
  if (!isPlatform(platform)) {
    return NextResponse.json(
      { error: "Invalid platform" },
      { status: 400, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  const parsed = upsertPlatformInstructionsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  const row = await upsertPlatformInstructions(
    userId,
    platform,
    parsed.data.instructions,
  );
  return NextResponse.json(row, {
    headers: { [CORRELATION_HEADER]: correlationId },
  });
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/platform-instructions/[platform]">,
) {
  const correlationId = getOrCreateCorrelationId(request);

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  const { platform } = await ctx.params;
  if (!isPlatform(platform)) {
    return NextResponse.json(
      { error: "Invalid platform" },
      { status: 400, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  await deletePlatformInstructions(userId, platform);
  return NextResponse.json(
    { ok: true },
    { headers: { [CORRELATION_HEADER]: correlationId } },
  );
}
