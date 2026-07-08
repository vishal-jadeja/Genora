import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import {
  FolderNotOwnedError,
  runGenerate,
  SlopGuardUnavailableError,
} from "@/lib/generation/generateService";
import { generatePostSchema } from "@/lib/generation/schema";

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
