import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { addApiKeySchema } from "@/lib/keys/schema";
import { listApiKeys, upsertApiKey } from "@/lib/keys/service";
import {
  CORRELATION_HEADER,
  getOrCreateCorrelationId,
} from "@/lib/logging/correlationId";

export async function GET(request: Request) {
  const correlationId = getOrCreateCorrelationId(request);

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  const keys = await listApiKeys(userId);
  return NextResponse.json(keys, {
    headers: { [CORRELATION_HEADER]: correlationId },
  });
}

export async function POST(request: Request) {
  const correlationId = getOrCreateCorrelationId(request);

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

  const parsed = addApiKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400, headers: { [CORRELATION_HEADER]: correlationId } },
    );
  }

  const { provider, key, label } = parsed.data;
  await upsertApiKey(userId, provider, key, label);

  const keys = await listApiKeys(userId);
  return NextResponse.json(
    keys.find((k) => k.provider === provider),
    { headers: { [CORRELATION_HEADER]: correlationId } },
  );
}
