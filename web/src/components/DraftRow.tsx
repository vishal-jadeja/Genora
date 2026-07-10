"use client";

import type { KeyboardEvent } from "react";
import { PLAT, STATUS_COLOR, STATUS_ICON } from "@/lib/genora/data";
import type { Post } from "@/lib/genora/types";
import { Hoverable } from "./Hoverable";
import { moveOptStyle, popoverStyle } from "./styleHelpers";
import type { GenoraViewProps } from "./viewProps";

interface DraftRowProps extends GenoraViewProps {
  post: Post;
}

export function DraftRow({ post, state, derived, actions }: DraftRowProps) {
  const statusColor = STATUS_COLOR[post.status];
  const renaming = state.renamingPostId === post.id;
  const menuOpen = state.moveMenu === post.id;
  const folderName = derived.folderName(post.folder) ?? "No folder";

  const onRenameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") actions.commitRenamePost();
    if (e.key === "Escape") actions.cancelRenamePost();
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "var(--c-surface)",
          border: "1px solid var(--c-borderStrong)",
          borderRadius: 12,
          padding: "13px 16px",
        }}
      >
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            flex: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: statusColor.c,
            background: statusColor.bg,
          }}
        >
          {STATUS_ICON[post.status]}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {renaming ? (
            <input
              autoFocus
              value={state.renameDraftValue}
              onChange={(e) => actions.onRenameDraftInput(e.target.value)}
              onKeyDown={onRenameKeyDown}
              onBlur={actions.commitRenamePost}
              style={{
                width: "100%",
                background: "var(--c-popover)",
                border: "1px solid var(--c-borderHover)",
                borderRadius: 6,
                padding: "4px 8px",
                fontFamily: "var(--font-newsreader), serif",
                fontSize: 15,
                color: "var(--c-text)",
              }}
            />
          ) : (
            <button
              onClick={() => actions.openPost(post)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                padding: 0,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-newsreader), serif",
                  fontSize: 15,
                  color: "var(--c-text)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {post.title || "Untitled"}
              </div>
            </button>
          )}
          <div
            style={{
              fontSize: 12,
              color: "var(--c-text4)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginTop: 2,
            }}
          >
            {folderName} · {post.edited}
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, flex: "none" }}>
          {post.platforms.map((id) => (
            <span
              key={id}
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 8.5,
                fontWeight: 600,
                color: PLAT[id].color,
                background: PLAT[id].bg,
              }}
            >
              {PLAT[id].mono}
            </span>
          ))}
        </div>
        <Hoverable
          as="button"
          title="More"
          onClick={() => actions.toggleMove(post.id)}
          style={{
            width: 26,
            height: 26,
            flex: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "1px solid var(--c-borderStrong)",
            borderRadius: 7,
            color: "var(--c-text3)",
          }}
          hoverStyle={{
            borderColor: "var(--c-borderHover)",
            color: "var(--c-text)",
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <circle cx="5" cy="12" r="1" />
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
          </svg>
        </Hoverable>
      </div>

      {menuOpen && (
        <div style={{ ...popoverStyle, top: 48, right: 16, left: "auto" }}>
          <button
            onClick={() => {
              actions.toggleMove(post.id);
              actions.openPost(post);
            }}
            style={moveOptStyle}
          >
            Open
          </button>
          <button
            onClick={() => actions.duplicatePost(post.id)}
            style={moveOptStyle}
          >
            Duplicate
          </button>
          <button
            onClick={() => actions.startRenamePost(post.id)}
            style={moveOptStyle}
          >
            Rename
          </button>
          <div
            style={{
              fontSize: 10.5,
              color: "var(--c-text5)",
              padding: "7px 9px 4px",
              letterSpacing: ".06em",
              textTransform: "uppercase",
            }}
          >
            Move to
          </div>
          <button
            onClick={() => actions.moveTo(post.id, null)}
            style={moveOptStyle}
          >
            No folder
          </button>
          {state.folders.map((f) => (
            <button
              key={f.id}
              onClick={() => actions.moveTo(post.id, f.id)}
              style={moveOptStyle}
            >
              {f.name}
            </button>
          ))}
          <div
            style={{
              height: 1,
              background: "var(--c-borderStrong)",
              margin: "4px 2px",
            }}
          />
          <button
            onClick={() => {
              actions.toggleMove(post.id);
              actions.openConfirmDialog({
                kind: "deletePost",
                postId: post.id,
              });
            }}
            style={{ ...moveOptStyle, color: "#d47a7a" }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
