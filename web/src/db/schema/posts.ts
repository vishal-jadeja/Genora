import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { postStatusEnum } from "./enums";
import { folders } from "./folders";
import { users } from "./users";

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    folderId: uuid("folder_id").references(() => folders.id, {
      onDelete: "set null",
    }),
    title: text("title"),
    rawContent: text("raw_content").notNull(),
    status: postStatusEnum("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("posts_user_id_created_at_idx").on(
      table.userId,
      table.createdAt.desc(),
    ),
    index("posts_folder_id_idx").on(table.folderId),
  ],
);
