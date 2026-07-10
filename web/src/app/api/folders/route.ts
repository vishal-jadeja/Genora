import { NextResponse } from "next/server";
import { handleKnownError, internalErrorResponse } from "@/lib/api/errorResponse";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import {
  createFolder,
  FolderNameTakenError,
  listFolders,
} from "@/lib/folders/service";
import { createFolderSchema } from "@/lib/folders/schema";
import {
  CORRELATION_HEADER,
  getOrCreateCorrelationId,
} from "@/lib/logging/correlationId";
import { createRequestLogger } from "@/lib/logging/logger";

export async function GET(request: Request) {
  const correlationId = getOrCreateCorrelationId(request);

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  const folders = await listFolders(userId);
  return NextResponse.json(folders, {
    headers: { [CORRELATION_HEADER]: correlationId },
  });
}

export async function POST(request: Request) {
  const correlationId = getOrCreateCorrelationId(request);
  const log = createRequestLogger(correlationId, { route: "/api/folders" });

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

  const parsed = createFolderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  try {
    const folder = await createFolder(userId, parsed.data.name);
    return NextResponse.json(folder, {
      status: 201,
      headers: { [CORRELATION_HEADER]: correlationId },
    });
  } catch (err) {
    const handled = handleKnownError(
      err,
      [
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
    log.error({ err }, "unhandled error in POST /api/folders");
    return internalErrorResponse(correlationId);
  }
}
