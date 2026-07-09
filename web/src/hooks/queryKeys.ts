import type { Platform } from "@/lib/generation/types";

export const foldersKey = ["folders"] as const;
export const apiKeysKey = ["apiKeys"] as const;
export const platformInstructionsKey = ["platformInstructions"] as const;
export const quotaKey = ["quota"] as const;

// Broad root for invalidating every post-related query (all list variants +
// all post details) after a mutation that could affect any of them.
export const postsRootKey = ["posts"] as const;

export function postsListKey(folderId?: string) {
  return ["posts", "list", folderId ?? null] as const;
}

export function postDetailKey(postId: string) {
  return ["posts", "detail", postId] as const;
}

export function platformVersionsKey(postId: string, platform: Platform) {
  return ["posts", "detail", postId, "versions", platform] as const;
}
