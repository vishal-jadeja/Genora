import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { listPlatformInstructions } from "@/lib/platformInstructions/service";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const instructions = await listPlatformInstructions(userId);
  return NextResponse.json(instructions);
}
