import { NextResponse } from "next/server";
import { platformEnum } from "@/db/schema";
import {
  handleKnownError,
  internalErrorResponse,
} from "@/lib/api/errorResponse";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import type { Platform } from "@/lib/generation/types";
import {
  CORRELATION_HEADER,
  getOrCreateCorrelationId,
} from "@/lib/logging/correlationId";
import { createRequestLogger } from "@/lib/logging/logger";
import { editPlatformOutputSchema } from "@/lib/posts/editPlatformOutputSchema";
import {
  editPlatformOutputContent,
  PlatformOutputNotFoundError,
  PostNotFoundError,
} from "@/lib/posts/service";

function isPlatform(value: string): value is Platform {
  return (platformEnum.enumValues as readonly string[]).includes(value);
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/posts/[id]/platforms/[platform]">,
) {
  const correlationId = getOrCreateCorrelationId(request);
  const log = createRequestLogger(correlationId, {
    route: "/api/posts/[id]/platforms/[platform]",
  });

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  const { id, platform } = await ctx.params;
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

  const parsed = editPlatformOutputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  try {
    const output = await editPlatformOutputContent(
      userId,
      id,
      platform,
      parsed.data.content,
    );
    return NextResponse.json(output, {
      headers: { [CORRELATION_HEADER]: correlationId },
    });
  } catch (err) {
    const handled = handleKnownError(
      err,
      [
        { test: PostNotFoundError, status: 404, message: () => "Not found" },
        {
          test: PlatformOutputNotFoundError,
          status: 404,
          message: () => "this platform has no generated content to edit yet",
        },
      ],
      log,
      correlationId,
    );
    if (handled) return handled;
    log.error(
      { err },
      "unhandled error in PATCH /api/posts/[id]/platforms/[platform]",
    );
    return internalErrorResponse(correlationId);
  }
}
