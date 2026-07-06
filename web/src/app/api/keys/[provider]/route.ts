import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { providerEnum } from "@/db/schema";
import { deleteApiKey, type Provider } from "@/lib/keys/service";

function isProvider(value: string): value is Provider {
  return (providerEnum.enumValues as readonly string[]).includes(value);
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/keys/[provider]">,
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider } = await ctx.params;
  if (!isProvider(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  await deleteApiKey(userId, provider);
  return NextResponse.json({ ok: true });
}
