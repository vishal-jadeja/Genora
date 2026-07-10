import { NextResponse } from "next/server";
import { z } from "zod";
import { handleKnownError, internalErrorResponse } from "@/lib/api/errorResponse";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import {
  CORRELATION_HEADER,
  getOrCreateCorrelationId,
} from "@/lib/logging/correlationId";
import { createRequestLogger } from "@/lib/logging/logger";
import {
  createPost,
  FolderNotOwnedError,
  listPosts,
} from "@/lib/posts/service";
import { createPostSchema } from "@/lib/posts/schema";

const folderIdQuerySchema = z.string().uuid().optional();

export async function GET(request: Request) {
  const correlationId = getOrCreateCorrelationId(request);

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  const { searchParams } = new URL(request.url);
  const parsedFolderId = folderIdQuerySchema.safeParse(
    searchParams.get("folderId") ?? undefined,
  );
  if (!parsedFolderId.success) {
    return NextResponse.json(
      { error: "folderId must be a valid UUID" },
      { status: 400, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  const posts = await listPosts(userId, parsedFolderId.data);
  return NextResponse.json(posts, {
    headers: { [CORRELATION_HEADER]: correlationId },
  });
}

export async function POST(request: Request) {
  const correlationId = getOrCreateCorrelationId(request);
  const log = createRequestLogger(correlationId, { route: "/api/posts" });

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

  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  try {
    const post = await createPost(userId, parsed.data);
    return NextResponse.json(post, {
      status: 201,
      headers: { [CORRELATION_HEADER]: correlationId },
    });
  } catch (err) {
    const handled = handleKnownError(
      err,
      [
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
    log.error({ err }, "unhandled error in POST /api/posts");
    return internalErrorResponse(correlationId);
  }
}
