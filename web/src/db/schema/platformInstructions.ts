import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { platformEnum } from "./enums";
import { users } from "./users";

export const platformInstructions = pgTable(
  "platform_instructions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platform: platformEnum("platform").notNull(),
    instructions: text("instructions").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("platform_instructions_user_id_platform_unique").on(
      table.userId,
      table.platform,
    ),
  ],
);
