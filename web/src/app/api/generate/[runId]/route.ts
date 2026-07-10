import { NextResponse } from "next/server";
import {
  handleKnownError,
  internalErrorResponse,
} from "@/lib/api/errorResponse";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { getRunStatus, RunAccessError } from "@/lib/generation/runStatus";
import {
  CORRELATION_HEADER,
  getOrCreateCorrelationId,
} from "@/lib/logging/correlationId";
import { createRequestLogger } from "@/lib/logging/logger";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/generate/[runId]">,
) {
  const correlationId = getOrCreateCorrelationId(request);
  const log = createRequestLogger(correlationId, {
    route: "/api/generate/[runId]",
  });

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  const { runId } = await ctx.params;

  try {
    const status = await getRunStatus(userId, runId);
    return NextResponse.json(status, {
      headers: { [CORRELATION_HEADER]: correlationId },
    });
  } catch (err) {
    const handled = handleKnownError(
      err,
      [{ test: RunAccessError, status: 404, message: () => "Not found" }],
      log,
      correlationId,
    );
    if (handled) return handled;
    log.error({ err }, "unhandled error in GET /api/generate/[runId]");
    return internalErrorResponse(correlationId);
  }
}
