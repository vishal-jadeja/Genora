import type { FolderRecord } from "@/lib/folders/service";
import type { PostSummary } from "@/lib/posts/service";
import type { Folder, Post, PostStatus } from "./types";

const STATUS_MAP: Record<string, PostStatus> = {
  draft: "Draft",
  generated: "Generated",
  edited: "Edited",
  exported: "Exported",
};

export function toMockFolder(f: FolderRecord): Folder {
  return { id: f.id, name: f.name };
}

export function relativeTimeShort(date: Date): string {
  const sec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return `${Math.floor(day / 7)}w`;
}

// GET /api/posts (list) doesn't include per-platform outputs — only
// GET /api/posts/:id does — so the per-post platform badges the prototype
// showed on list rows aren't populated here. Showing them accurately would
// require an N+1 fetch per row; left empty rather than faked. Revisit if the
// list endpoint grows a platform-summary field.
export function toMockPost(p: PostSummary): Post {
  return {
    id: p.id,
    title: p.title ?? "Untitled",
    snippet: p.rawContent.slice(0, 160),
    folder: p.folderId,
    status: STATUS_MAP[p.status] ?? "Draft",
    platforms: [],
    edited: relativeTimeShort(new Date(p.updatedAt)),
  };
}
