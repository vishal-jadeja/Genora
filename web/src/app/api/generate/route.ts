import { NextResponse } from "next/server";
import { handleKnownError, internalErrorResponse } from "@/lib/api/errorResponse";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import {
  FolderNotOwnedError,
  runGenerate,
  SlopGuardUnavailableError,
} from "@/lib/generation/generateService";
import { generatePostSchema } from "@/lib/generation/schema";
import {
  CORRELATION_HEADER,
  getOrCreateCorrelationId,
} from "@/lib/logging/correlationId";
import { createRequestLogger } from "@/lib/logging/logger";
import { checkRateLimit, createRateLimiter } from "@/lib/redis/rateLimit";

// 10 generations/minute/user — covers the sync Slop Guard call cost even for
// BYOK requests, since per-platform free-tier vs BYOK isn't resolved until
// deeper in the pipeline (see resolveGenerationKey.ts / redis/quota.ts for
// the real free-tier quota counter, separate from this abuse-rate limit).
const generateLimiter = createRateLimiter({ tokens: 10, window: "60 s" });

export async function POST(request: Request) {
  const correlationId = getOrCreateCorrelationId(request);
  const log = createRequestLogger(correlationId, { route: "/api/generate" });

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting is a safety net, not a core dependency — an Upstash outage
  // shouldn't take down generation entirely, so fail open on error.
  try {
    const rateLimit = await checkRateLimit(generateLimiter, userId);
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = generatePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let outcome;
  try {
    outcome = await runGenerate(userId, parsed.data, correlationId);
  } catch (err) {
    const handled = handleKnownError(
      err,
      [
        {
          test: FolderNotOwnedError,
          status: 400,
          message: () => "folderId does not belong to this user",
        },
        {
          test: SlopGuardUnavailableError,
          status: 502,
          message: () =>
            "content check is temporarily unavailable, please try again",
        },
      ],
      log,
      correlationId,
    );
    if (handled) return handled;
    log.error({ err }, "unhandled error in /api/generate");
    return internalErrorResponse(correlationId);
  }

  if (outcome.status === "rejected") {
    return NextResponse.json(
      { error: "rejected", slopGuard: outcome.slopGuard },
      { status: 422, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  return NextResponse.json(
    {
      postId: outcome.postId,
      runId: outcome.runId,
      publicAccessToken: outcome.publicAccessToken,
      slopGuard: outcome.slopGuard,
    },
    { status: 202, headers: { [CORRELATION_HEADER]: correlationId } },
  );
}
