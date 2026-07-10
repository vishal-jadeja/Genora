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
import {
  PostNotFoundError,
  restorePlatformOutputVersion,
  VersionNotFoundError,
} from "@/lib/posts/service";

function isPlatform(value: string): value is Platform {
  return (platformEnum.enumValues as readonly string[]).includes(value);
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/posts/[id]/platforms/[platform]/versions/[version]/restore">,
) {
  const correlationId = getOrCreateCorrelationId(request);
  const log = createRequestLogger(correlationId, {
    route: "/api/posts/[id]/platforms/[platform]/versions/[version]/restore",
  });

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  const { id, platform, version } = await ctx.params;
  if (!isPlatform(platform)) {
    return NextResponse.json(
      { error: "Invalid platform" },
      { status: 400, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  const versionNumber = Number(version);
  if (!Number.isInteger(versionNumber) || versionNumber < 1) {
    return NextResponse.json(
      { error: "Invalid version" },
      { status: 400, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  try {
    const restored = await restorePlatformOutputVersion(
      userId,
      id,
      platform,
      versionNumber,
    );
    return NextResponse.json(restored, {
      headers: { [CORRELATION_HEADER]: correlationId },
    });
  } catch (err) {
    const handled = handleKnownError(
      err,
      [
        { test: PostNotFoundError, status: 404, message: () => "Not found" },
        {
          test: VersionNotFoundError,
          status: 404,
          message: () => "Version not found",
        },
      ],
      log,
      correlationId,
    );
    if (handled) return handled;
    log.error(
      { err },
      "unhandled error in POST /api/posts/[id]/platforms/[platform]/versions/[version]/restore",
    );
    return internalErrorResponse(correlationId);
  }
}
