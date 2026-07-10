import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { providerEnum } from "@/db/schema";
import { deleteApiKey, type Provider } from "@/lib/keys/service";
import {
  CORRELATION_HEADER,
  getOrCreateCorrelationId,
} from "@/lib/logging/correlationId";

function isProvider(value: string): value is Provider {
  return (providerEnum.enumValues as readonly string[]).includes(value);
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/keys/[provider]">,
) {
  const correlationId = getOrCreateCorrelationId(request);

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  const { provider } = await ctx.params;
  if (!isProvider(provider)) {
    return NextResponse.json(
      { error: "Invalid provider" },
      { status: 400, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  await deleteApiKey(userId, provider);
  return NextResponse.json(
    { ok: true },
    { headers: { [CORRELATION_HEADER]: correlationId } },
  );
}
