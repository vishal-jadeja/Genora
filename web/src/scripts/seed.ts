import { config } from "dotenv";

config({ path: ".env.local" });

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { and, eq } from "drizzle-orm";
import { folders, posts, users } from "../db/schema";

const SEED_EMAIL = "seed@genora.test";
const SEED_FOLDER_NAME = "Essays";
const SEED_POST_TITLE = "My first raw thought";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const result = await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ email: SEED_EMAIL, name: "Seed User" })
      .onConflictDoUpdate({
        target: users.email,
        set: { name: "Seed User" },
      })
      .returning();

    let [folder] = await tx
      .select()
      .from(folders)
      .where(
        and(eq(folders.userId, user.id), eq(folders.name, SEED_FOLDER_NAME)),
      );

    if (!folder) {
      [folder] = await tx
        .insert(folders)
        .values({ userId: user.id, name: SEED_FOLDER_NAME })
        .returning();
    }

    let [post] = await tx
      .select()
      .from(posts)
      .where(and(eq(posts.userId, user.id), eq(posts.title, SEED_POST_TITLE)));

    if (!post) {
      [post] = await tx
        .insert(posts)
        .values({
          userId: user.id,
          folderId: folder.id,
          title: SEED_POST_TITLE,
          rawContent:
            "This is a raw, unpolished thought written once and repurposed across platforms.",
          status: "draft",
        })
        .returning();
    }

    return { user, folder, post };
  });

  console.log("Seed complete:");
  console.log(`  user:   ${result.user.id} (${result.user.email})`);
  console.log(`  folder: ${result.folder.id} (${result.folder.name})`);
  console.log(`  post:   ${result.post.id} (${result.post.title})`);

  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
