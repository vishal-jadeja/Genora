import { NextResponse } from "next/server";
import { platformEnum } from "@/db/schema";
import {
  handleKnownError,
  internalErrorResponse,
} from "@/lib/api/errorResponse";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import {
  ModelRequiredError,
  regeneratePlatform,
} from "@/lib/generation/generateService";
import { regeneratePlatformSchema } from "@/lib/generation/regenerateSchema";
import type { Platform } from "@/lib/generation/types";
import {
  CORRELATION_HEADER,
  getOrCreateCorrelationId,
} from "@/lib/logging/correlationId";
import { createRequestLogger } from "@/lib/logging/logger";
import { PostNotFoundError } from "@/lib/posts/service";
import { checkRateLimit, createRateLimiter } from "@/lib/redis/rateLimit";

function isPlatform(value: string): value is Platform {
  return (platformEnum.enumValues as readonly string[]).includes(value);
}

// Same cap as /api/generate — regenerate triggers the identical costly
// pipeline (real LLM call, possible free-tier quota burn, BYOK provider
// spend) and needs the same abuse-rate throttle.
const regenerateLimiter = createRateLimiter({ tokens: 10, window: "60 s" });

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/posts/[id]/platforms/[platform]/regenerate">,
) {
  const correlationId = getOrCreateCorrelationId(request);
  const log = createRequestLogger(correlationId, {
    route: "/api/posts/[id]/platforms/[platform]/regenerate",
  });

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting is a safety net, not a core dependency — an Upstash outage
  // shouldn't take down regeneration entirely, so fail open on error.
  try {
    const rateLimit = await checkRateLimit(regenerateLimiter, userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests, please slow down" },
        {
          status: 429,
          headers: {
            "Retry-After": Math.max(
              0,
              Math.ceil((rateLimit.reset - Date.now()) / 1000),
            ).toString(),
            [CORRELATION_HEADER]: correlationId,
          },
        },
      );
    }
  } catch (err) {
    log.warn({ err }, "rate limit check failed, failing open");
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
      correlationId,
    );
    return NextResponse.json(
      { runId, publicAccessToken },
      { status: 202, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  } catch (err) {
    const handled = handleKnownError(
      err,
      [
        { test: PostNotFoundError, status: 404, message: () => "Not found" },
        {
          test: ModelRequiredError,
          status: 400,
          message: (e) => e.message,
        },
      ],
      log,
      correlationId,
    );
    if (handled) return handled;
    log.error({ err }, "unhandled error in regenerate route");
    return internalErrorResponse(correlationId);
  }
}
