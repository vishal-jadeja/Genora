import { NextResponse } from "next/server";
import { handleKnownError, internalErrorResponse } from "@/lib/api/errorResponse";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import {
  deleteFolder,
  FolderNameTakenError,
  FolderNotFoundError,
  renameFolder,
} from "@/lib/folders/service";
import { renameFolderSchema } from "@/lib/folders/schema";
import {
  CORRELATION_HEADER,
  getOrCreateCorrelationId,
} from "@/lib/logging/correlationId";
import { createRequestLogger } from "@/lib/logging/logger";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/folders/[id]">,
) {
  const correlationId = getOrCreateCorrelationId(request);
  const log = createRequestLogger(correlationId, {
    route: "/api/folders/[id]",
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

  const parsed = renameFolderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  const { id } = await ctx.params;

  try {
    const folder = await renameFolder(userId, id, parsed.data.name);
    return NextResponse.json(folder, {
      headers: { [CORRELATION_HEADER]: correlationId },
    });
  } catch (err) {
    const handled = handleKnownError(
      err,
      [
        {
          test: FolderNotFoundError,
          status: 404,
          message: () => "Not found",
        },
        {
          test: FolderNameTakenError,
          status: 409,
          message: () => "A folder with this name already exists",
        },
      ],
      log,
      correlationId,
    );
    if (handled) return handled;
    log.error({ err }, "unhandled error in PATCH /api/folders/[id]");
    return internalErrorResponse(correlationId);
  }
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/folders/[id]">,
) {
  const correlationId = getOrCreateCorrelationId(request);
  const log = createRequestLogger(correlationId, {
    route: "/api/folders/[id]",
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
    await deleteFolder(userId, id);
    return NextResponse.json(
      { ok: true },
      { headers: { [CORRELATION_HEADER]: correlationId } },
    );
  } catch (err) {
    const handled = handleKnownError(
      err,
      [
        {
          test: FolderNotFoundError,
          status: 404,
          message: () => "Not found",
        },
      ],
      log,
      correlationId,
    );
    if (handled) return handled;
    log.error({ err }, "unhandled error in DELETE /api/folders/[id]");
    return internalErrorResponse(correlationId);
  }
}
