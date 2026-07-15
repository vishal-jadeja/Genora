"use client";

import type { CSSProperties, KeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import type { Folder } from "@/lib/genora/types";
import { usePopoverDismissBySelector } from "@/hooks/usePopoverDismiss";
import { Hoverable } from "./Hoverable";
import { moveOptStyle, popoverStyle } from "./styleHelpers";
import type { GenoraViewProps } from "./viewProps";

function folderButtonStyle(active: boolean): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    background: active ? "var(--c-surfaceHover)" : "transparent",
    border: "none",
    borderRadius: 9,
    padding: "8px 26px 8px 10px",
    fontSize: 13.5,
    textAlign: "left",
  };
}

const SIDEBAR_FOLDER_LIST_LIMIT = 6;

function navItemStyle(active: boolean): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 11,
    marginTop: 8,
    background: active ? "var(--c-surfaceHover)" : "none",
    border: "none",
    borderRadius: 9,
    padding: "9px 11px",
    color: active ? "var(--c-text)" : "var(--c-text3)",
    fontSize: 13.5,
    fontWeight: active ? 500 : 400,
    textAlign: "left",
  };
}

export function Sidebar({ state, derived, actions }: GenoraViewProps) {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";
  const isDrafts = pathname === "/drafts";

  const onFolderClick = (id: string) => {
    if (isDrafts) {
      actions.setDraftsFolderFilter(id);
    } else {
      actions.selectFolder(id);
      actions.goDash();
    }
  };

  const onRenameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") actions.commitRenameFolder();
    if (e.key === "Escape") actions.cancelRenameFolder();
  };

  usePopoverDismissBySelector(
    state.folderMenu !== null,
    () => actions.toggleFolderMenu(state.folderMenu),
    '[data-folder-menu-open="true"]',
  );

  return (
    <aside
      style={{
        width: 270,
        flex: "none",
        borderRight: "1px solid var(--c-border)",
        display: "flex",
        flexDirection: "column",
        padding: "16px 12px",
        background: "var(--c-shell)",
      }}
    >
      <Hoverable
        as="button"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 2,
          background: "var(--c-surface)",
          border: "1px solid var(--c-borderStrong)",
          borderRadius: 10,
          padding: "9px 11px",
          color: "var(--c-text3)",
          fontSize: 13,
        }}
        hoverStyle={{ borderColor: "var(--c-borderStrong)" }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" />
        </svg>
        <span style={{ flex: 1, textAlign: "left" }}>Search</span>
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 11,
            color: "var(--c-text5)",
            border: "1px solid var(--c-borderStrong)",
            borderRadius: 5,
            padding: "1px 6px",
          }}
        >
          ⌘K
        </span>
      </Hoverable>

      <button onClick={actions.homeClick} style={navItemStyle(isDashboard)}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 11l9-8 9 8" />
          <path d="M5 10v10h14V10" />
        </svg>
        Home
      </button>

      <button onClick={actions.goDrafts} style={navItemStyle(isDrafts)}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 2.5h8L18 6v15.5H6z" />
          <path d="M14 2.5V6h4" />
        </svg>
        Drafts
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 4px 8px 10px",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: ".09em",
            textTransform: "uppercase",
            color: "var(--c-text5)",
          }}
        >
          Folders
        </span>
        <Hoverable
          as="button"
          title="New folder"
          onClick={actions.startNewFolder}
          style={{
            width: 22,
            height: 22,
            flex: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "none",
            borderRadius: 6,
            color: "var(--c-text4)",
          }}
          hoverStyle={{
            background: "var(--c-popover)",
            color: "var(--c-text)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <path d="M12 11v5M9.5 13.5h5" />
          </svg>
        </Hoverable>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {state.folders.slice(0, SIDEBAR_FOLDER_LIST_LIMIT).map((f: Folder) => {
          const active = isDrafts
            ? state.draftsFolderFilter === f.id
            : state.activeFolder === f.id;
          const renaming = state.renamingFolderId === f.id;
          const menuOpen = state.folderMenu === f.id;
          return (
            <div
              key={f.id}
              data-folder-menu-open={menuOpen ? "true" : undefined}
              style={{ position: "relative" }}
            >
              {renaming ? (
                <input
                  autoFocus
                  value={state.renameFolderValue}
                  onChange={(e) => actions.onRenameFolderInput(e.target.value)}
                  onKeyDown={onRenameKeyDown}
                  onBlur={actions.commitRenameFolder}
                  style={{
                    width: "100%",
                    background: "var(--c-surface)",
                    border: "1px solid var(--c-borderHover)",
                    borderRadius: 9,
                    padding: "7px 10px",
                    fontSize: 13.5,
                  }}
                />
              ) : (
                <button
                  onClick={() => onFolderClick(f.id)}
                  style={folderButtonStyle(active)}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      overflow: "hidden",
                      color: active ? "var(--c-text)" : "var(--c-text4)",
                    }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flex: "none" }}
                    >
                      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                    <span
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: active ? "var(--c-text)" : "var(--c-text2)",
                      }}
                    >
                      {f.name}
                    </span>
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--c-text5)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {derived.counts[f.id] ?? 0}
                  </span>
                </button>
              )}
              {!renaming && (
                <Hoverable
                  as="button"
                  title="Folder options"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => actions.toggleFolderMenu(f.id)}
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: 4,
                    transform: "translateY(-50%)",
                    width: 20,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "none",
                    border: "none",
                    borderRadius: 5,
                    color: "var(--c-text5)",
                  }}
                  hoverStyle={{
                    background: "var(--c-popover)",
                    color: "var(--c-text)",
                  }}
                >
                  <svg
                    width="12"
                    height="12"
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
              )}
              {menuOpen && (
                <div
                  role="menu"
                  style={{ ...popoverStyle, top: 30, right: 4, left: "auto" }}
                >
                  <button
                    role="menuitem"
                    onClick={() => actions.startRenameFolder(f.id)}
                    style={moveOptStyle}
                  >
                    Rename
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      actions.toggleFolderMenu(null);
                      actions.openConfirmDialog({
                        kind: "deleteFolder",
                        folderId: f.id,
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
        })}
      </nav>

      {state.folders.length > SIDEBAR_FOLDER_LIST_LIMIT && (
        <button
          onClick={actions.goDash}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 2,
            background: "none",
            border: "none",
            borderRadius: 9,
            padding: "8px 10px",
            color: "var(--c-text4)",
            fontSize: 12.5,
            textAlign: "left",
          }}
        >
          View all folders ({state.folders.length})
        </button>
      )}

      <div
        style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "10px 11px",
            border: "1px solid var(--c-borderStrong)",
            borderRadius: 10,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              flex: "none",
              background: derived.hasKey
                ? "#6cae8e"
                : derived.quotaLow
                  ? "#d4a960"
                  : "var(--c-text)",
            }}
          />
          <span
            style={{ fontSize: 12, color: "var(--c-text2)", lineHeight: 1.3 }}
          >
            {derived.quotaText}
          </span>
        </div>
        <Hoverable
          as="button"
          onClick={() => actions.goSettings()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            background: "none",
            border: "none",
            color: "var(--c-text3)",
            fontSize: 13.5,
            padding: "9px 11px",
            textAlign: "left",
            borderRadius: 9,
          }}
          hoverStyle={{
            background: "var(--c-popover)",
            color: "var(--c-text)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
          </svg>
          Settings
        </Hoverable>
      </div>
    </aside>
  );
}
