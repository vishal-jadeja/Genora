import { pgEnum } from "drizzle-orm/pg-core";

export const platformEnum = pgEnum("platform", [
  "linkedin",
  "x",
  "reddit",
  "medium",
  "substack",
]);

export const providerEnum = pgEnum("provider", [
  "anthropic",
  "openai",
  "gemini",
  "groq",
]);

export const postStatusEnum = pgEnum("post_status", [
  "draft",
  "generated",
  "edited",
  "exported",
]);

export const outputStatusEnum = pgEnum("output_status", [
  "pending",
  "success",
  "failed",
]);

export const generationStageEnum = pgEnum("generation_stage", [
  "writer",
  "critic",
  "reviser",
]);
