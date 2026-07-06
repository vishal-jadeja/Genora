"use client";

import type { CSSProperties } from "react";
import { ORDER, PLAT } from "@/lib/genora/data";
import type { DraftsSort, PlatformId, PostStatus } from "@/lib/genora/types";
import { DraftRow } from "./DraftRow";
import type { GenoraViewProps } from "./viewProps";

const STATUS_OPTIONS: (PostStatus | "all")[] = [
  "all",
  "Draft",
  "Generated",
  "Edited",
  "Exported",
];

const SORT_OPTIONS: { id: DraftsSort; label: string }[] = [
  { id: "recent", label: "Recent" },
  { id: "oldest", label: "Oldest" },
  { id: "title", label: "Title A–Z" },
];

const selectStyle: CSSProperties = {
  background: "var(--c-surface)",
  border: "1px solid var(--c-borderStrong)",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 12.5,
  color: "var(--c-text2)",
};

export function DraftsView({ state, derived, actions }: GenoraViewProps) {
  return (
    <main
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        background: "var(--c-canvas)",
      }}
    >
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          <div
            style={{
              borderBottom: "1px solid var(--c-border)",
              padding: "24px 40px",
            }}
          >
            <div
              style={{
                maxWidth: 920,
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div>
                <h1
                  style={{
                    margin: "0 0 4px",
                    fontFamily: "var(--font-newsreader), serif",
                    fontSize: 26,
                    fontWeight: 500,
                    color: "var(--c-text)",
                  }}
                >
                  Drafts
                </h1>
                <p style={{ margin: 0, fontSize: 13.5, color: "var(--c-text3)" }}>
                  Every thought you&rsquo;ve started, in one place.
                </p>
              </div>
              <button
                onClick={() => actions.newPost(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flex: "none",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 18px",
                  fontSize: 13.5,
                  fontWeight: 600,
                  background: "var(--c-primaryBg)",
                  color: "var(--c-primaryText)",
                }}
              >
                New draft<span style={{ fontSize: 13 }}>→</span>
              </button>
            </div>
          </div>

          <div
            style={{ maxWidth: 920, margin: "0 auto", padding: "24px 40px 64px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 20,
              }}
            >
              <input
                value={state.draftsSearch}
                onChange={(e) => actions.setDraftsSearch(e.target.value)}
                placeholder="Search drafts…"
                style={{
                  ...selectStyle,
                  flex: "1 1 200px",
                  minWidth: 160,
                }}
              />
              <select
                value={state.draftsStatusFilter}
                onChange={(e) =>
                  actions.setDraftsStatusFilter(
                    e.target.value as PostStatus | "all",
                  )
                }
                style={selectStyle}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === "all" ? "All statuses" : s}
                  </option>
                ))}
              </select>
              <select
                value={state.draftsPlatformFilter}
                onChange={(e) =>
                  actions.setDraftsPlatformFilter(
                    e.target.value as PlatformId | "all",
                  )
                }
                style={selectStyle}
              >
                <option value="all">All platforms</option>
                {ORDER.map((id) => (
                  <option key={id} value={id}>
                    {PLAT[id].label}
                  </option>
                ))}
              </select>
              <select
                value={state.draftsFolderFilter}
                onChange={(e) => actions.setDraftsFolderFilter(e.target.value)}
                style={selectStyle}
              >
                <option value="all">All folders</option>
                <option value="none">No folder</option>
                {state.folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <select
                value={state.draftsSort}
                onChange={(e) =>
                  actions.setDraftsSort(e.target.value as DraftsSort)
                }
                style={selectStyle}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {derived.draftsEmpty && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  padding: "60px 20px",
                  animation: "ffade .3s ease",
                }}
              >
                <h2
                  style={{
                    margin: "0 0 8px",
                    fontFamily: "var(--font-newsreader), serif",
                    fontWeight: 500,
                    fontSize: 20,
                    color: "var(--c-text)",
                  }}
                >
                  No drafts yet
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "var(--c-text3)",
                    fontSize: 14,
                    maxWidth: 360,
                    lineHeight: 1.55,
                  }}
                >
                  Start one from the button above, or write your first thought
                  from the dashboard.
                </p>
              </div>
            )}

            {derived.draftsNoMatch && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  padding: "56px 20px",
                  border: "1px dashed var(--c-borderStrong)",
                  borderRadius: 14,
                  animation: "ffade .3s ease",
                }}
              >
                <h2
                  style={{
                    margin: "0 0 8px",
                    fontFamily: "var(--font-newsreader), serif",
                    fontWeight: 500,
                    fontSize: 19,
                    color: "var(--c-text)",
                  }}
                >
                  Nothing matches these filters
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "var(--c-text3)",
                    fontSize: 13.5,
                    maxWidth: 320,
                    lineHeight: 1.5,
                  }}
                >
                  Try clearing the search or widening a filter.
                </p>
              </div>
            )}

            {!derived.draftsEmpty && !derived.draftsNoMatch && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {derived.draftsRows.map((p) => (
                  <DraftRow
                    key={p.id}
                    post={p}
                    state={state}
                    derived={derived}
                    actions={actions}
                  />
                ))}
              </div>
            )}
          </div>
      </div>
    </main>
  );
}
