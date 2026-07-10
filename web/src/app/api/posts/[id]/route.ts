import { NextResponse } from "next/server";
import {
  handleKnownError,
  internalErrorResponse,
} from "@/lib/api/errorResponse";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import {
  CORRELATION_HEADER,
  getOrCreateCorrelationId,
} from "@/lib/logging/correlationId";
import { createRequestLogger } from "@/lib/logging/logger";
import {
  deletePost,
  FolderNotOwnedError,
  getPost,
  PostNotFoundError,
  updatePost,
} from "@/lib/posts/service";
import { updatePostSchema } from "@/lib/posts/schema";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/posts/[id]">,
) {
  const correlationId = getOrCreateCorrelationId(request);
  const log = createRequestLogger(correlationId, {
    route: "/api/posts/[id]",
  });

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  const { id } = await ctx.params;

  try {
    const post = await getPost(userId, id);
    return NextResponse.json(post, {
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
    log.error({ err }, "unhandled error in GET /api/posts/[id]");
    return internalErrorResponse(correlationId);
  }
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/posts/[id]">,
) {
  const correlationId = getOrCreateCorrelationId(request);
  const log = createRequestLogger(correlationId, {
    route: "/api/posts/[id]",
  });

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { [CORRELATION_HEADER]: correlationId } },
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

  const parsed = updatePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  const { id } = await ctx.params;

  try {
    const post = await updatePost(userId, id, parsed.data);
    return NextResponse.json(post, {
      headers: { [CORRELATION_HEADER]: correlationId },
    });
  } catch (err) {
    const handled = handleKnownError(
      err,
      [
        { test: PostNotFoundError, status: 404, message: () => "Not found" },
        {
          test: FolderNotOwnedError,
          status: 400,
          message: () => "folderId does not belong to this user",
        },
      ],
      log,
      correlationId,
    );
    if (handled) return handled;
    log.error({ err }, "unhandled error in PATCH /api/posts/[id]");
    return internalErrorResponse(correlationId);
  }
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/posts/[id]">,
) {
  const correlationId = getOrCreateCorrelationId(request);
  const log = createRequestLogger(correlationId, {
    route: "/api/posts/[id]",
  });

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  const { id } = await ctx.params;

  try {
    await deletePost(userId, id);
    return NextResponse.json(
      { ok: true },
      { headers: { [CORRELATION_HEADER]: correlationId } },
    );
  } catch (err) {
    const handled = handleKnownError(
      err,
      [{ test: PostNotFoundError, status: 404, message: () => "Not found" }],
      log,
      correlationId,
    );
    if (handled) return handled;
    log.error({ err }, "unhandled error in DELETE /api/posts/[id]");
    return internalErrorResponse(correlationId);
  }
}
