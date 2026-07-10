import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import {
  FolderNotOwnedError,
  runGenerate,
  SlopGuardUnavailableError,
} from "@/lib/generation/generateService";
import { generatePostSchema } from "@/lib/generation/schema";
import { checkRateLimit, createRateLimiter } from "@/lib/redis/rateLimit";

// 10 generations/minute/user — covers the sync Slop Guard call cost even for
// BYOK requests, since per-platform free-tier vs BYOK isn't resolved until
// deeper in the pipeline (see resolveGenerationKey.ts / redis/quota.ts for
// the real free-tier quota counter, separate from this abuse-rate limit).
const generateLimiter = createRateLimiter({ tokens: 10, window: "60 s" });

export async function POST(request: Request) {
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
          },
        },
      );
    }
  } catch (err) {
    console.error("Rate limit check failed, failing open", err);
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
    outcome = await runGenerate(userId, parsed.data);
  } catch (err) {
    if (err instanceof FolderNotOwnedError) {
      return NextResponse.json(
        { error: "folderId does not belong to this user" },
        { status: 400 },
      );
    }
    if (err instanceof SlopGuardUnavailableError) {
      return NextResponse.json(
        { error: "content check is temporarily unavailable, please try again" },
        { status: 502 },
      );
    }
    throw err;
  }

  if (outcome.status === "rejected") {
    return NextResponse.json(
      { error: "rejected", slopGuard: outcome.slopGuard },
      { status: 422 },
    );
  }

  return NextResponse.json(
    {
      postId: outcome.postId,
      runId: outcome.runId,
      publicAccessToken: outcome.publicAccessToken,
      slopGuard: outcome.slopGuard,
    },
    { status: 202 },
  );
}
