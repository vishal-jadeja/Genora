import { NextResponse } from "next/server";
import { platformEnum } from "@/db/schema";
import { handleKnownError, internalErrorResponse } from "@/lib/api/errorResponse";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import type { Platform } from "@/lib/generation/types";
import {
  CORRELATION_HEADER,
  getOrCreateCorrelationId,
} from "@/lib/logging/correlationId";
import { createRequestLogger } from "@/lib/logging/logger";
import { listPlatformOutputVersions, PostNotFoundError } from "@/lib/posts/service";

function isPlatform(value: string): value is Platform {
  return (platformEnum.enumValues as readonly string[]).includes(value);
}

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/posts/[id]/platforms/[platform]/versions">,
) {
  const correlationId = getOrCreateCorrelationId(request);
  const log = createRequestLogger(correlationId, {
    route: "/api/posts/[id]/platforms/[platform]/versions",
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

  try {
    const versions = await listPlatformOutputVersions(userId, id, platform);
    return NextResponse.json(versions, {
      headers: { [CORRELATION_HEADER]: correlationId },
    });
  } catch (err) {
    const handled = handleKnownError(
      err,
      [{ test: PostNotFoundError, status: 404, message: () => "Not found" }],
      log,
      correlationId,
    );
    if (handled) return handled;
    log.error(
      { err },
      "unhandled error in GET /api/posts/[id]/platforms/[platform]/versions",
    );
    return internalErrorResponse(correlationId);
  }
}
