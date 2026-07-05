import {
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { generationStageEnum, providerEnum } from "./enums";
import { platformOutputs } from "./platformOutputs";
import { posts } from "./posts";
import { users } from "./users";

export const usageLogs = pgTable(
  "usage_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("post_id").references(() => posts.id, {
      onDelete: "set null",
    }),
    platformOutputId: uuid("platform_output_id").references(
      () => platformOutputs.id,
      {
        onDelete: "set null",
      },
    ),
    stage: generationStageEnum("stage"),
    provider: providerEnum("provider").notNull(),
    model: text("model").notNull(),
    promptTokens: integer("prompt_tokens").notNull().default(0),
    completionTokens: integer("completion_tokens").notNull().default(0),
    totalTokens: integer("total_tokens").notNull().default(0),
    costUsd: numeric("cost_usd", { precision: 10, scale: 6 })
      .notNull()
      .default("0"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("usage_logs_user_id_created_at_idx").on(
      table.userId,
      table.createdAt.desc(),
    ),
  ],
);
