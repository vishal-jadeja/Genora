import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { outputStatusEnum, platformEnum, providerEnum } from "./enums";
import { posts } from "./posts";

export const platformOutputs = pgTable(
  "platform_outputs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    platform: platformEnum("platform").notNull(),
    version: integer("version").notNull(),
    content: text("content"),
    status: outputStatusEnum("status").notNull().default("pending"),
    revisionCount: integer("revision_count").notNull().default(0),
    errorReason: text("error_reason"),
    provider: providerEnum("provider"),
    model: text("model"),
    isCurrent: boolean("is_current").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("platform_outputs_post_platform_version_unique").on(
      table.postId,
      table.platform,
      table.version,
    ),
    index("platform_outputs_post_platform_current_idx").on(
      table.postId,
      table.platform,
      table.isCurrent,
    ),
    // Backs the "at most one current row per post+platform" invariant at the
    // DB level — persistResult.ts's advisory lock enforces this today, but
    // this constraint means no future write path can silently violate it.
    uniqueIndex("platform_outputs_one_current")
      .on(table.postId, table.platform)
      .where(sql`${table.isCurrent}`),
    index("platform_outputs_post_id_idx").on(table.postId),
  ],
);
