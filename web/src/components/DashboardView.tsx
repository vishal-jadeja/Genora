"use client";

import {
  MODELS,
  ORDER,
  PLAT,
  STATUS_COLOR,
  STATUS_ICON,
} from "@/lib/genora/data";
import { Hoverable } from "./Hoverable";
import {
  chipStyle,
  glassPanelStyle,
  monoStyle,
  moveOptStyle,
  optStyle,
  popoverStyle,
} from "./styleHelpers";
import type { GenoraViewProps } from "./viewProps";

export function DashboardView({ state, derived, actions }: GenoraViewProps) {
  return <Main state={state} derived={derived} actions={actions} />;
}

function Main({ state, derived, actions }: GenoraViewProps) {
  const dashExpanded = derived.dashExpanded;

  const composeFolderOptions = [
    { id: null as string | null, name: "No folder" },
    ...state.folders.map((f) => ({ id: f.id, name: f.name })),
  ];

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
          style={{ maxWidth: 920, margin: "0 auto", padding: "56px 40px 64px" }}
        >
          <h1
            style={{
              textAlign: "center",
              margin: "0 0 30px",
              fontFamily: "var(--font-newsreader), serif",
              fontSize: 34,
              fontWeight: 500,
              letterSpacing: "-.015em",
              color: "var(--c-text)",
            }}
          >
            {derived.greeting}
          </h1>

          {/* inline composer */}
          <div
            style={glassPanelStyle({
              border: dashExpanded
                ? "1px solid var(--c-borderHover)"
                : "1px solid var(--c-glassBorder)",
              boxShadow: "0 10px 20px rgba(0,0,0,.1)",
              transition: "border-color .2s ease",
            })}
          >
            <div style={{ display: "flex", gap: 13, padding: "18px 18px 6px" }}>
              <span
                style={{ marginTop: 3, flex: "none", color: "var(--c-text3)" }}
              >
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z" />
                </svg>
              </span>
              <textarea
                value={state.dashDraft}
                onChange={(e) => actions.onDashDraft(e.target.value)}
                onFocus={actions.dashFocus}
                placeholder="What's the thought? Write it once — Genora reshapes it for every platform."
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  resize: "none",
                  fontFamily: "var(--font-newsreader), serif",
                  fontSize: 17,
                  lineHeight: 1.55,
                  color: "var(--c-text)",
                  padding: "2px 0",
                  minHeight: dashExpanded ? 84 : 28,
                  transition: "min-height .2s ease",
                }}
              />
            </div>

            {dashExpanded && (
              <div style={{ animation: "ffade .18s ease" }}>
                <div
                  style={{
                    display: "flex",
                    gap: 7,
                    flexWrap: "wrap",
                    padding: "8px 16px 0",
                  }}
                >
                  {ORDER.map((id) => {
                    const sel = state.platforms[id];
                    return (
                      <button
                        key={id}
                        onClick={() => actions.togglePlatform(id)}
                        style={chipStyle(id, sel)}
                      >
                        <span style={monoStyle(id, sel)}>{PLAT[id].mono}</span>
                        {PLAT[id].label}
                      </button>
                    );
                  })}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                    padding: "14px 14px",
                    marginTop: 12,
                    borderTop: "1px solid var(--c-borderStrong)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flex: "none",
                    }}
                  >
                    {/* folder select */}
                    <div style={{ position: "relative" }}>
                      <Hoverable
                        as="button"
                        onClick={actions.openFolderPicker}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          background: "var(--c-popover)",
                          border: "1px solid var(--c-borderStrong)",
                          borderRadius: 8,
                          color: "var(--c-text2)",
                          fontSize: 12.5,
                          padding: "7px 11px",
                        }}
                        hoverStyle={{ borderColor: "var(--c-borderHover)" }}
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
                        </svg>
                        {derived.folderName(state.composeFolder) || "None"}
                        <span style={{ color: "var(--c-text5)", fontSize: 9 }}>
                          ▾
                        </span>
                      </Hoverable>
                      {state.folderPickerOpen && (
                        <div style={{ ...popoverStyle, bottom: 40, left: 0 }}>
                          {composeFolderOptions.map((o) => (
                            <button
                              key={o.id ?? "none"}
                              onClick={() => actions.pickComposeFolder(o.id)}
                              style={optStyle(state.composeFolder === o.id)}
                            >
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
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          background: "var(--c-popover)",
                          border: "1px solid var(--c-borderStrong)",
                          borderRadius: 8,
                          color: "var(--c-text2)",
                          fontSize: 12.5,
                          padding: "7px 11px",
                        }}
                        hoverStyle={{ borderColor: "var(--c-borderHover)" }}
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
                          <path d="M12 3l1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9z" />
                        </svg>
                        {derived.curModel.label}
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 600,
                            color: derived.curModel.free
                              ? "#6cae8e"
                              : "var(--c-text2)",
                            border: "1px solid var(--c-borderHover)",
                            borderRadius: 4,
                            padding: "1px 5px",
                          }}
                        >
                          {derived.curModel.free ? "Free" : "BYOK"}
                        </span>
                        <span style={{ color: "var(--c-text5)", fontSize: 9 }}>
                          ▾
                        </span>
                      </Hoverable>
                      {state.modelOpen && (
                        <div
                          style={{
                            ...popoverStyle,
                            bottom: 40,
                            left: 0,
                            minWidth: 250,
                          }}
                        >
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
                                  background: selected
                                    ? "var(--c-borderStrong)"
                                    : "transparent",
                                  border: "none",
                                  borderRadius: 7,
                                  padding: "9px 10px",
                                  fontSize: 13,
                                  color: locked
                                    ? "var(--c-text5)"
                                    : "var(--c-text2)",
                                  textAlign: "left",
                                }}
                              >
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                >
                                  {m.label}
                                  <span
                                    style={{
                                      fontSize: 9,
                                      fontWeight: 600,
                                      color: locked
                                        ? "var(--c-text5)"
                                        : m.free
                                          ? "#6cae8e"
                                          : "var(--c-text2)",
                                      border: "1px solid var(--c-borderHover)",
                                      borderRadius: 4,
                                      padding: "1px 5px",
                                    }}
                                  >
                                    {locked ? "Locked" : m.tag}
                                  </span>
                                </span>
                                <span
                                  style={{ color: "#6cae8e", fontSize: 12 }}
                                >
                                  {selected ? "✓" : ""}
                                </span>
                              </button>
                            );
                          })}
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--c-text5)",
                              padding: "8px 9px 4px",
                              lineHeight: 1.4,
                            }}
                          >
                            {derived.hasKey
                              ? "All models unlocked via your key."
                              : "Add an API key in Settings to choose other models."}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 12 }} />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flex: "none",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        fontSize: 11.5,
                        color: "var(--c-text5)",
                      }}
                    >
                      ~{derived.dashTok} tokens
                    </span>
                    <Hoverable
                      as="button"
                      onClick={actions.openEditorFromDash}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--c-text3)",
                        fontSize: 12.5,
                        padding: "8px 4px",
                      }}
                      hoverStyle={{ color: "var(--c-text)" }}
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
                          ? {
                            background: "var(--c-primaryBg)",
                            color: "var(--c-primaryText)",
                          }
                          : {
                            background: "var(--c-popover)",
                            color: "var(--c-text5)",
                            cursor: "not-allowed",
                          }),
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  margin: "44px 2px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    color: "var(--c-text2)",
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
                    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                  <span style={{ fontSize: 14.5, fontWeight: 600 }}>
                    Folders
                  </span>
                </div>
                <Hoverable
                  as="button"
                  onClick={actions.startNewFolder}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    background: "none",
                    border: "1px solid var(--c-borderStrong)",
                    borderRadius: 8,
                    color: "var(--c-text2)",
                    fontSize: 12.5,
                    padding: "6px 12px",
                  }}
                  hoverStyle={{
                    borderColor: "var(--c-borderHover)",
                    color: "var(--c-text)",
                  }}
                >
                  New
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </Hoverable>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,minmax(0,1fr))",
                  gap: 12,
                }}
              >
                {state.folders.map((f) => (
                  <Hoverable
                    key={f.id}
                    as="button"
                    onClick={() => actions.selectFolder(f.id)}
                    style={{
                      minWidth: 0,
                      textAlign: "left",
                      background: "var(--c-surface)",
                      border: "1px solid var(--c-borderStrong)",
                      borderRadius: 12,
                      padding: 16,
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                    hoverStyle={{
                      borderColor: "var(--c-borderHover)",
                      background: "var(--c-surfaceHover)",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--c-text)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {f.name}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--c-text4)" }}>
                        {derived.counts[f.id]}{" "}
                        {derived.counts[f.id] === 1 ? "post" : "posts"}
                      </span>
                    </span>
                    <span style={{ color: "var(--c-text5)", flex: "none" }}>
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      </svg>
                    </span>
                  </Hoverable>
                ))}
              </div>
            </>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              margin: "40px 2px 16px",
              color: "var(--c-text2)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2.5h8L18 6v15.5H6z" />
              <path d="M14 2.5V6h4" />
            </svg>
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>
              Recent posts
            </span>
            <div style={{ flex: 1 }} />
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                maxWidth: 280,
                width: "100%",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 12,
                  color: "var(--c-text5)",
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
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4-4" />
                </svg>
              </span>
              <input
                value={state.search}
                onChange={(e) => actions.onSearch(e.target.value)}
                placeholder="Filter posts…"
                style={{
                  width: "100%",
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-borderStrong)",
                  borderRadius: 9,
                  padding: "8px 12px 8px 34px",
                  fontSize: 12.5,
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              flexWrap: "wrap",
              margin: "0 2px 16px",
            }}
          >
            <button
              onClick={() => actions.setDraftsPlatformFilter("all")}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: `1px solid ${state.draftsPlatformFilter === "all" ? "var(--c-borderHover)" : "var(--c-borderStrong)"}`,
                background:
                  state.draftsPlatformFilter === "all"
                    ? "var(--c-surfaceHover)"
                    : "transparent",
                color:
                  state.draftsPlatformFilter === "all"
                    ? "var(--c-text)"
                    : "var(--c-text3)",
                fontSize: 12.5,
                fontWeight: 500,
              }}
            >
              All platforms
            </button>
            {ORDER.map((id) => {
              const sel = state.draftsPlatformFilter === id;
              return (
                <button
                  key={id}
                  onClick={() => actions.setDraftsPlatformFilter(id)}
                  style={chipStyle(id, sel)}
                >
                  <span style={monoStyle(id, sel)}>{PLAT[id].mono}</span>
                  {PLAT[id].label}
                </button>
              );
            })}
          </div>

          {derived.hasRows && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                gap: 12,
              }}
            >
              {derived.rows.map((p) => {
                const statusColor = STATUS_COLOR[p.status];
                return (
                  <div key={p.id} style={{ position: "relative" }}>
                    <Hoverable
                      as="button"
                      onClick={() => actions.openPost(p)}
                      style={{
                        width: "100%",
                        minWidth: 0,
                        textAlign: "left",
                        background: "var(--c-surface)",
                        border: "1px solid var(--c-borderStrong)",
                        borderRadius: 12,
                        padding: 16,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        minHeight: 136,
                      }}
                      hoverStyle={{
                        borderColor: "var(--c-borderHover)",
                        background: "var(--c-surfaceHover)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                          paddingRight: 26,
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
                          {STATUS_ICON[p.status]}
                        </span>
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: statusColor.c,
                          }}
                        >
                          {p.status}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: "var(--font-newsreader), serif",
                            fontSize: 16,
                            color: "var(--c-text)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            marginBottom: 4,
                          }}
                        >
                          {p.title}
                        </div>
                        <div
                          style={{
                            fontSize: 12.5,
                            color: "var(--c-text4)",
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 5,
                            flex: 1,
                            minWidth: 0,
                            overflow: "hidden",
                          }}
                        >
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
                                fontFamily:
                                  "var(--font-jetbrains-mono), monospace",
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
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--c-text5)",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            flex: "none",
                          }}
                        >
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.9"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
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
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "var(--c-popover)",
                        border: "1px solid var(--c-borderStrong)",
                        borderRadius: 6,
                        color: "var(--c-text3)",
                        opacity: 0.85,
                      }}
                      hoverStyle={{
                        opacity: 1,
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
                    {state.moveMenu === p.id && (
                      <div
                        style={{
                          ...popoverStyle,
                          top: 42,
                          right: 16,
                          left: "auto",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10.5,
                            color: "var(--c-text5)",
                            padding: "5px 9px 6px",
                            letterSpacing: ".06em",
                            textTransform: "uppercase",
                          }}
                        >
                          Move to
                        </div>
                        <button
                          onClick={() => actions.moveTo(p.id, null)}
                          style={moveOptStyle}
                        >
                          No folder
                        </button>
                        {state.folders.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => actions.moveTo(p.id, f.id)}
                            style={moveOptStyle}
                          >
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
                }}
              >
                {state.activeFolder
                  ? `Nothing in ${derived.folderName(state.activeFolder)} yet`
                  : "No posts match this filter"}
              </h2>
              <p
                style={{
                  margin: "0 0 18px",
                  color: "var(--c-text3)",
                  fontSize: 13.5,
                  maxWidth: 320,
                  lineHeight: 1.5,
                }}
              >
                Write a thought above, or move an existing post into this folder
                from its ⋯ menu.
              </p>
            </div>
          )}

          {derived.showEmptyAll && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "60px 20px 20px",
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
                A blank page, and that&rsquo;s a good thing
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
                Start with one real thought in the box above. No folders
                required — you can organize later.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
