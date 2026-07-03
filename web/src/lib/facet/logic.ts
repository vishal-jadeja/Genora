import type { SlopStrictness } from "./types";

export function wordCount(text: string): number {
  const trimmed = (text || "").trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function thresholds(strictness: SlopStrictness): {
  hard: number;
  soft: number;
} {
  if (strictness === "lenient") return { hard: 4, soft: 14 };
  if (strictness === "strict") return { hard: 14, soft: 48 };
  return { hard: 8, soft: 30 };
}
