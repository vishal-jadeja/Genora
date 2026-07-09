import { NextResponse } from "next/server";
import { platformEnum } from "@/db/schema";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import type { Platform } from "@/lib/generation/types";
import { editPlatformOutputSchema } from "@/lib/posts/editPlatformOutputSchema";
import {
  editPlatformOutputContent,
  PlatformOutputNotFoundError,
  PostNotFoundError,
} from "@/lib/posts/service";

function isPlatform(value: string): value is Platform {
  return (platformEnum.enumValues as readonly string[]).includes(value);
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/posts/[id]/platforms/[platform]">,
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, platform } = await ctx.params;
  if (!isPlatform(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = editPlatformOutputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const output = await editPlatformOutputContent(
      userId,
      id,
      platform,
      parsed.data.content,
    );
    return NextResponse.json(output);
  } catch (err) {
    if (err instanceof PostNotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (err instanceof PlatformOutputNotFoundError) {
      return NextResponse.json(
        { error: "this platform has no generated content to edit yet" },
        { status: 404 },
      );
    }
    throw err;
  }
}
