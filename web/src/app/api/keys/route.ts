import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { addApiKeySchema } from "@/lib/keys/schema";
import { listApiKeys, upsertApiKey } from "@/lib/keys/service";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await listApiKeys(userId);
  return NextResponse.json(keys);
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = addApiKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { provider, key, label } = parsed.data;
  await upsertApiKey(userId, provider, key, label);

  const keys = await listApiKeys(userId);
  return NextResponse.json(keys.find((k) => k.provider === provider));
}
