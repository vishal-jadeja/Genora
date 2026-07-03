"use client";

import type { CSSProperties } from "react";
import { MODELS, ORDER, PLAT, STATUS_COLOR, STATUS_ICON } from "@/lib/facet/data";
import type { Folder } from "@/lib/facet/types";
import { Hoverable } from "./Hoverable";
import { chipStyle, monoStyle, moveOptStyle, optStyle, popoverStyle } from "./styleHelpers";
import type { FacetViewProps } from "./viewProps";

function folderButtonStyle(active: boolean): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    background: active ? "var(--c-surfaceHover)" : "transparent",
    border: "none",
    borderRadius: 9,
    padding: "8px 10px",
    fontSize: 13.5,
    textAlign: "left",
  };
}

export function DashboardView({ state, derived, actions }: FacetViewProps) {
  return (
    <div style={{ display: "flex", height: "100%" }}>
      <Sidebar state={state} derived={derived} actions={actions} />
      <Main state={state} derived={derived} actions={actions} />
    </div>
  );
}

function Sidebar({ state, derived, actions }: FacetViewProps) {
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
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "6px 8px 4px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Genora" width={32} height={32} style={{ borderRadius: 9, flex: "none" }} />
        <div style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Facet
          </div>
          <div style={{ fontSize: 11.5, color: "#6b6b6b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            write once, publish everywhere
          </div>
        </div>
        <Hoverable
          as="button"
          title="New folder"
          style={{
            width: 28,
            height: 28,
            flex: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "1px solid var(--c-borderStrong)",
            borderRadius: 8,
            color: "#8f8f8f",
          }}
          hoverStyle={{ borderColor: "var(--c-borderHover)", color: "#ededed" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <path d="M12 11v5M9.5 13.5h5" />
          </svg>
        </Hoverable>
      </div>

      <Hoverable
        as="button"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 14,
          background: "var(--c-surface)",
          border: "1px solid var(--c-borderStrong)",
          borderRadius: 10,
          padding: "9px 11px",
          color: "#8f8f8f",
          fontSize: 13,
        }}
        hoverStyle={{ borderColor: "var(--c-borderStrong)" }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" />
        </svg>
        <span style={{ flex: 1, textAlign: "left" }}>Search</span>
        <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11, color: "#565656", border: "1px solid var(--c-borderStrong)", borderRadius: 5, padding: "1px 6px" }}>
          ⌘K
        </span>
      </Hoverable>

      <button
        onClick={actions.homeClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          marginTop: 8,
          background: "var(--c-surfaceHover)",
          border: "none",
          borderRadius: 9,
          padding: "9px 11px",
          color: "#ededed",
          fontSize: 13.5,
          fontWeight: 500,
          textAlign: "left",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11l9-8 9 8" />
          <path d="M5 10v10h14V10" />
        </svg>
        Home
      </button>

      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".09em", textTransform: "uppercase", color: "#565656", padding: "20px 10px 8px" }}>
        Folders
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {state.folders.map((f: Folder) => {
          const active = state.activeFolder === f.id;
          return (
            <button key={f.id} onClick={() => actions.selectFolder(f.id)} style={folderButtonStyle(active)}>
              <span style={{ display: "flex", alignItems: "center", gap: 11, overflow: "hidden", color: active ? "#ededed" : "#6b6b6b" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
                  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: active ? "#ededed" : "#b0b0b0" }}>
                  {f.name}
                </span>
              </span>
              <span style={{ fontSize: 12, color: "#565656", fontVariantNumeric: "tabular-nums" }}>
                {derived.counts[f.id] ?? 0}
              </span>
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 11px", border: "1px solid var(--c-borderStrong)", borderRadius: 10 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", flex: "none", background: derived.hasKey ? "#6cae8e" : derived.quotaLow ? "#d4a960" : "#ededed" }} />
          <span style={{ fontSize: 12, color: "#9a9a9a", lineHeight: 1.3 }}>{derived.quotaText}</span>
        </div>
        <Hoverable
          as="button"
          onClick={() => actions.goSettings()}
          style={{ display: "flex", alignItems: "center", gap: 11, background: "none", border: "none", color: "#8f8f8f", fontSize: 13.5, padding: "9px 11px", textAlign: "left", borderRadius: 9 }}
          hoverStyle={{ background: "var(--c-popover)", color: "#ededed" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
          </svg>
          Settings
        </Hoverable>
      </div>
    </aside>
  );
}

function Main({ state, derived, actions }: FacetViewProps) {
  const dashExpanded = derived.dashExpanded;

  const composeFolderOptions = [
    { id: null as string | null, name: "No folder" },
    ...state.folders.map((f) => ({ id: f.id, name: f.name })),
  ];

  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--c-canvas)" }}>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "56px 40px 64px" }}>
          <h1 style={{ textAlign: "center", margin: "0 0 30px", fontFamily: "var(--font-newsreader), serif", fontSize: 34, fontWeight: 500, letterSpacing: "-.015em", color: "#f3f3f3" }}>
            {derived.greeting}
          </h1>

          {/* inline composer */}
          <div
            style={{
              background: "var(--c-surface)",
              border: `1px solid ${dashExpanded ? "var(--c-borderHover)" : "var(--c-borderStrong)"}`,
              borderRadius: 16,
              transition: "border-color .2s ease",
              boxShadow: "0 1px 0 rgba(255,255,255,.02)",
            }}
          >
            <div style={{ display: "flex", gap: 13, padding: "18px 18px 6px" }}>
              <span style={{ marginTop: 3, flex: "none", color: "#8f8f8f" }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z" />
                </svg>
              </span>
              <textarea
                value={state.dashDraft}
                onChange={(e) => actions.onDashDraft(e.target.value)}
                onFocus={actions.dashFocus}
                placeholder="What's the thought? Write it once — Facet reshapes it for every platform."
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  resize: "none",
                  fontFamily: "var(--font-newsreader), serif",
                  fontSize: 17,
                  lineHeight: 1.55,
                  color: "#e6e6e6",
                  padding: "2px 0",
                  minHeight: dashExpanded ? 84 : 28,
                  transition: "min-height .2s ease",
                }}
              />
            </div>

            {dashExpanded && (
              <div style={{ animation: "ffade .18s ease" }}>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", padding: "8px 16px 0" }}>
                  {ORDER.map((id) => {
                    const sel = state.platforms[id];
                    return (
                      <button key={id} onClick={() => actions.togglePlatform(id)} style={chipStyle(id, sel)}>
                        <span style={monoStyle(id, sel)}>{PLAT[id].mono}</span>
                        {PLAT[id].label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "14px 14px", marginTop: 12, borderTop: "1px solid var(--c-borderStrong)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
                    {/* folder select */}
                    <div style={{ position: "relative" }}>
                      <Hoverable
                        as="button"
                        onClick={actions.openFolderPicker}
                        style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--c-popover)", border: "1px solid var(--c-borderStrong)", borderRadius: 8, color: "#c4c4c4", fontSize: 12.5, padding: "7px 11px" }}
                        hoverStyle={{ borderColor: "var(--c-borderHover)" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        </svg>
                        {derived.folderName(state.composeFolder) || "None"}
                        <span style={{ color: "#565656", fontSize: 9 }}>▾</span>
                      </Hoverable>
                      {state.folderPickerOpen && (
                        <div style={{ ...popoverStyle, bottom: 40, left: 0 }}>
                          {composeFolderOptions.map((o) => (
                            <button key={o.id ?? "none"} onClick={() => actions.pickComposeFolder(o.id)} style={optStyle(state.composeFolder === o.id)}>
                              {o.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* model select */}
                    <div style={{ position: "relative" }}>
                      <Hoverable
                        as="button"
                        onClick={actions.openModel}
                        style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--c-popover)", border: "1px solid var(--c-borderStrong)", borderRadius: 8, color: "#c4c4c4", fontSize: 12.5, padding: "7px 11px" }}
                        hoverStyle={{ borderColor: "var(--c-borderHover)" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 3l1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9z" />
                        </svg>
                        {derived.curModel.label}
                        <span style={{ fontSize: 9, fontWeight: 600, color: derived.curModel.free ? "#6cae8e" : "#c9c9c9", border: "1px solid var(--c-borderHover)", borderRadius: 4, padding: "1px 5px" }}>
                          {derived.curModel.free ? "Free" : "BYOK"}
                        </span>
                        <span style={{ color: "#565656", fontSize: 9 }}>▾</span>
                      </Hoverable>
                      {state.modelOpen && (
                        <div style={{ ...popoverStyle, bottom: 40, left: 0, minWidth: 250 }}>
                          {MODELS.map((m) => {
                            const locked = !m.free && !derived.hasKey;
                            const selected = state.model === m.id;
                            return (
                              <button
                                key={m.id}
                                onClick={() => actions.pickModel(m)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 12,
                                  width: "100%",
                                  background: selected ? "var(--c-borderStrong)" : "transparent",
                                  border: "none",
                                  borderRadius: 7,
                                  padding: "9px 10px",
                                  fontSize: 13,
                                  color: locked ? "#565656" : "#d6d6d6",
                                  textAlign: "left",
                                }}
                              >
                                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  {m.label}
                                  <span style={{ fontSize: 9, fontWeight: 600, color: locked ? "#565656" : m.free ? "#6cae8e" : "#c9c9c9", border: "1px solid var(--c-borderHover)", borderRadius: 4, padding: "1px 5px" }}>
                                    {locked ? "Locked" : m.tag}
                                  </span>
                                </span>
                                <span style={{ color: "#6cae8e", fontSize: 12 }}>{selected ? "✓" : ""}</span>
                              </button>
                            );
                          })}
                          <div style={{ fontSize: 11, color: "#565656", padding: "8px 9px 4px", lineHeight: 1.4 }}>
                            {derived.hasKey ? "All models unlocked via your key." : "Add an API key in Settings to choose other models."}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 12 }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
                    <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11.5, color: "#565656" }}>
                      ~{derived.dashTok} tokens
                    </span>
                    <Hoverable
                      as="button"
                      onClick={actions.openEditorFromDash}
                      style={{ background: "none", border: "none", color: "#8f8f8f", fontSize: 12.5, padding: "8px 4px" }}
                      hoverStyle={{ color: "#ededed" }}
                    >
                      Open editor
                    </Hoverable>
                    <button
                      onClick={actions.dashGenerate}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        border: "none",
                        borderRadius: 8,
                        padding: "8px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        ...(derived.dashCanGen
                          ? { background: "#f0f0f0", color: "var(--c-shell)" }
                          : { background: "var(--c-popover)", color: "#565656", cursor: "not-allowed" }),
                      }}
                    >
                      Generate<span style={{ fontSize: 13 }}>→</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {derived.hasContent && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "44px 2px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, color: "#c4c4c4" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                  <span style={{ fontSize: 14.5, fontWeight: 600 }}>Folders</span>
                </div>
                <Hoverable
                  as="button"
                  style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "1px solid var(--c-borderStrong)", borderRadius: 8, color: "#c4c4c4", fontSize: 12.5, padding: "6px 12px" }}
                  hoverStyle={{ borderColor: "var(--c-borderHover)", color: "#ededed" }}
                >
                  New
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </Hoverable>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12 }}>
                {state.folders.map((f) => (
                  <Hoverable
                    key={f.id}
                    as="button"
                    onClick={() => actions.selectFolder(f.id)}
                    style={{ minWidth: 0, textAlign: "left", background: "var(--c-surface)", border: "1px solid var(--c-borderStrong)", borderRadius: 12, padding: 16, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}
                    hoverStyle={{ borderColor: "var(--c-borderHover)", background: "var(--c-surfaceHover)" }}
                  >
                    <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#ededed", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {f.name}
                      </span>
                      <span style={{ fontSize: 12, color: "#6b6b6b" }}>
                        {derived.counts[f.id]} {derived.counts[f.id] === 1 ? "post" : "posts"}
                      </span>
                    </span>
                    <span style={{ color: "#565656", flex: "none" }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      </svg>
                    </span>
                  </Hoverable>
                ))}
              </div>
            </>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "40px 2px 16px", color: "#c4c4c4" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2.5h8L18 6v15.5H6z" />
              <path d="M14 2.5V6h4" />
            </svg>
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>Recent posts</span>
            <div style={{ flex: 1 }} />
            <div style={{ position: "relative", display: "flex", alignItems: "center", maxWidth: 280, width: "100%" }}>
              <span style={{ position: "absolute", left: 12, color: "#565656" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4-4" />
                </svg>
              </span>
              <input
                value={state.search}
                onChange={(e) => actions.onSearch(e.target.value)}
                placeholder="Filter posts…"
                style={{ width: "100%", background: "var(--c-surface)", border: "1px solid var(--c-borderStrong)", borderRadius: 9, padding: "8px 12px 8px 34px", fontSize: 12.5 }}
              />
            </div>
          </div>

          {derived.hasRows && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
              {derived.rows.map((p) => {
                const statusColor = STATUS_COLOR[p.status];
                return (
                  <div key={p.id} style={{ position: "relative" }}>
                    <Hoverable
                      as="button"
                      onClick={() => actions.openPost(p)}
                      style={{ width: "100%", minWidth: 0, textAlign: "left", background: "var(--c-surface)", border: "1px solid var(--c-borderStrong)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12, minHeight: 136 }}
                      hoverStyle={{ borderColor: "var(--c-borderHover)", background: "var(--c-surfaceHover)" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 9, paddingRight: 26 }}>
                        <span style={{ width: 26, height: 26, borderRadius: 7, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", color: statusColor.c, background: statusColor.bg }}>
                          {STATUS_ICON[p.status]}
                        </span>
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: statusColor.c }}>{p.status}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 16, color: "#ededed", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 4 }}>
                          {p.title}
                        </div>
                        <div
                          style={{
                            fontSize: 12.5,
                            color: "#6b6b6b",
                            lineHeight: 1.4,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {p.snippet || "No text yet — just a title."}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 5, flex: 1, minWidth: 0, overflow: "hidden" }}>
                          {p.platforms.map((id) => (
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
                                flex: "none",
                                color: PLAT[id].color,
                                background: PLAT[id].bg,
                              }}
                            >
                              {PLAT[id].mono}
                            </span>
                          ))}
                        </div>
                        <span style={{ fontSize: 11, color: "#565656", display: "flex", alignItems: "center", gap: 4, flex: "none" }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 7v5l3 2" />
                          </svg>
                          {p.edited}
                        </span>
                      </div>
                    </Hoverable>
                    <Hoverable
                      as="button"
                      title="Move to folder"
                      onClick={() => actions.toggleMove(p.id)}
                      style={{ position: "absolute", top: 12, right: 12, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--c-popover)", border: "1px solid var(--c-borderStrong)", borderRadius: 6, color: "#8f8f8f", opacity: 0.85 }}
                      hoverStyle={{ opacity: 1, borderColor: "var(--c-borderHover)", color: "#ededed" }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <circle cx="5" cy="12" r="1" />
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="19" cy="12" r="1" />
                      </svg>
                    </Hoverable>
                    {state.moveMenu === p.id && (
                      <div style={{ ...popoverStyle, top: 42, right: 16, left: "auto" }}>
                        <div style={{ fontSize: 10.5, color: "#565656", padding: "5px 9px 6px", letterSpacing: ".06em", textTransform: "uppercase" }}>
                          Move to
                        </div>
                        <button onClick={() => actions.moveTo(p.id, null)} style={moveOptStyle}>
                          No folder
                        </button>
                        {state.folders.map((f) => (
                          <button key={f.id} onClick={() => actions.moveTo(p.id, f.id)} style={moveOptStyle}>
                            {f.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {derived.showEmptyFolder && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "56px 20px", border: "1px dashed var(--c-borderStrong)", borderRadius: 14, animation: "ffade .3s ease" }}>
              <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-newsreader), serif", fontWeight: 500, fontSize: 19 }}>
                Nothing in {derived.folderName(state.activeFolder)} yet
              </h2>
              <p style={{ margin: "0 0 18px", color: "#8f8f8f", fontSize: 13.5, maxWidth: 320, lineHeight: 1.5 }}>
                Write a thought above, or move an existing post into this folder from its ⋯ menu.
              </p>
            </div>
          )}

          {derived.showEmptyAll && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "60px 20px 20px", animation: "ffade .3s ease" }}>
              <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-newsreader), serif", fontWeight: 500, fontSize: 20, color: "#dedede" }}>
                A blank page, and that&rsquo;s a good thing
              </h2>
              <p style={{ margin: 0, color: "#8f8f8f", fontSize: 14, maxWidth: 360, lineHeight: 1.55 }}>
                Start with one real thought in the box above. No folders required — you can organize later.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
