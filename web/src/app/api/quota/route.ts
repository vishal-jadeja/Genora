import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import {
  CORRELATION_HEADER,
  getOrCreateCorrelationId,
} from "@/lib/logging/correlationId";
import { peekQuota } from "@/lib/redis/quota";

export async function GET(request: Request) {
  const correlationId = getOrCreateCorrelationId(request);

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  const quota = await peekQuota(userId);
  return NextResponse.json(quota, {
    headers: { [CORRELATION_HEADER]: correlationId },
  });
}
