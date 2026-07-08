import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import {
  createFolder,
  FolderNameTakenError,
  listFolders,
} from "@/lib/folders/service";
import { createFolderSchema } from "@/lib/folders/schema";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folders = await listFolders(userId);
  return NextResponse.json(folders);
}

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

  const parsed = createFolderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const folder = await createFolder(userId, parsed.data.name);
    return NextResponse.json(folder, { status: 201 });
  } catch (err) {
    if (err instanceof FolderNameTakenError) {
      return NextResponse.json(
        { error: "A folder with this name already exists" },
        { status: 409 },
      );
    }
    throw err;
  }
}
