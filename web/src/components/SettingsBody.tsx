"use client";

import type { CSSProperties } from "react";
import { MODELS, ORDER, PLAT, PROVIDERS } from "@/lib/genora/data";
import type {
  ProviderId,
  SettingsTab,
  SlopStrictness,
  ThemeMode,
} from "@/lib/genora/types";
import { Hoverable } from "./Hoverable";
import { GREEN, PRIMARY, radioStyle } from "./styleHelpers";
import type { GenoraViewProps } from "./viewProps";

function TabIcon({ id }: { id: SettingsTab }) {
  const common = {
    width: 15,
    height: 15,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (id === "usage")
    return (
      <svg {...common}>
        <path d="M4 19h16M8 19V9M13 19V5M18 19v-7" />
      </svg>
    );
  if (id === "keys")
    return (
      <svg {...common}>
        <circle cx="8" cy="15" r="4" />
        <path d="M11 12l9-9M17 3h4v4M14 6l3 3" />
      </svg>
    );
  if (id === "instructions")
    return (
      <svg {...common}>
        <path d="M6 2.5h8L18 6v15.5H6z" />
        <path d="M9 11h6M9 15h6" />
      </svg>
    );
  if (id === "voice")
    return (
      <svg {...common}>
        <path d="M4 12v0M8 8v8M12 5v14M16 8v8M20 12v0" />
      </svg>
    );
  if (id === "slop")
    return (
      <svg {...common}>
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M12 3l1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9z" />
    </svg>
  );
}

const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: "usage", label: "Usage" },
  { id: "keys", label: "API keys" },
  { id: "instructions", label: "Platform instructions" },
  { id: "voice", label: "Voice calibration" },
  { id: "slop", label: "Slop Guard" },
  { id: "model", label: "Default model" },
];

export const THEME_MODES: { id: ThemeMode; label: string }[] = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export function ThemeToggle({
  state,
  actions,
}: Pick<GenoraViewProps, "state" | "actions">) {
  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        padding: 2,
        background: "var(--c-tile)",
        border: "1px solid var(--c-border)",
        borderRadius: 8,
      }}
    >
      {THEME_MODES.map((m) => {
        const selected = state.themeMode === m.id;
        return (
          <button
            key={m.id}
            onClick={() => actions.setThemeMode(m.id)}
            style={{
              border: "none",
              borderRadius: 6,
              padding: "5px 11px",
              fontSize: 12,
              fontWeight: 600,
              background: selected ? "var(--c-surface)" : "transparent",
              color: selected ? "var(--c-text)" : "var(--c-text3)",
            }}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

const SLOP_OPTIONS: { id: SlopStrictness; label: string; desc: string }[] = [
  {
    id: "lenient",
    label: "Lenient",
    desc: "Only block completely empty or one-line input. Nudge rarely.",
  },
  {
    id: "balanced",
    label: "Balanced",
    desc: "Block bare topics with no stance; nudge thin-but-real drafts.",
  },
  {
    id: "strict",
    label: "Strict",
    desc: "Demand a clear opinion and a concrete detail before generating.",
  },
];

function navTabStyle(active: boolean): CSSProperties {
  return {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    textAlign: "left",
    background: active ? "var(--c-surfaceHover)" : "transparent",
    border: "none",
    borderRadius: 9,
    padding: "9px 11px",
    fontSize: 13.5,
    color: active ? "var(--c-text)" : "var(--c-text3)",
  };
}

function strictOptStyle(selected: boolean): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    width: "100%",
    background: selected ? "var(--c-surfaceHover)" : "var(--c-surface)",
    border: `1px solid ${selected ? "var(--c-borderHover)" : "var(--c-borderStrong)"}`,
    borderRadius: 12,
    padding: "14px 16px",
  };
}

function modelItemStyle(selected: boolean): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    background: selected ? "var(--c-surfaceHover)" : "var(--c-surface)",
    border: `1px solid ${selected ? "var(--c-borderHover)" : "var(--c-borderStrong)"}`,
    borderRadius: 12,
    padding: "14px 16px",
  };
}

function statCardStyle(): CSSProperties {
  return {
    flex: 1,
    border: "1px solid var(--c-borderStrong)",
    borderRadius: 12,
    padding: "16px 18px",
    background: "var(--c-surface)",
  };
}

export function SettingsBody({ state, derived, actions }: GenoraViewProps) {
  return (
    <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
      <nav
        style={{
          width: 224,
          flex: "none",
          borderRight: "1px solid var(--c-border)",
          padding: "20px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {SETTINGS_TABS.map((s) => (
          <button
            key={s.id}
            onClick={() => actions.setSettingsTab(s.id)}
            style={navTabStyle(state.settingsTab === s.id)}
          >
            <TabIcon id={s.id} />
            {s.label}
          </button>
        ))}
      </nav>

      <div style={{ flex: 1, overflowY: "auto", padding: "36px 44px" }}>
        <div style={{ maxWidth: 640 }}>
          {state.settingsTab === "usage" && (
            <>
              <h2
                style={{
                  margin: "0 0 6px",
                  fontFamily: "var(--font-newsreader), serif",
                  fontWeight: 500,
                  fontSize: 23,
                }}
              >
                Usage
              </h2>
              <p
                style={{
                  margin: "0 0 20px",
                  color: "var(--c-text3)",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {derived.tierBanner}
              </p>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={statCardStyle()}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: derived.hasKey ? GREEN : "var(--c-text3)",
                      marginBottom: 8,
                    }}
                  >
                    {derived.hasKey ? "BYOK" : "FREE TIER"}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>
                    {derived.quotaText}
                  </div>
                </div>
                <div style={statCardStyle()}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--c-text3)",
                      marginBottom: 8,
                    }}
                  >
                    SLOP GUARD
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>
                    {state.blockedCount}
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 400,
                        color: "var(--c-text3)",
                        marginLeft: 6,
                      }}
                    >
                      low-substance drafts blocked
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {state.settingsTab === "keys" && (
            <>
              <h2
                style={{
                  margin: "0 0 6px",
                  fontFamily: "var(--font-newsreader), serif",
                  fontWeight: 500,
                  fontSize: 23,
                }}
              >
                API keys
              </h2>
              <p
                style={{
                  margin: "0 0 20px",
                  color: "var(--c-text3)",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                Bring your own key to remove the daily cap and unlock every
                model.
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {PROVIDERS.map((pr) => {
                  const k = state.keys[pr.id as ProviderId];
                  return (
                    <div
                      key={pr.id}
                      style={{
                        border: "1px solid var(--c-borderStrong)",
                        borderRadius: 12,
                        padding: "16px 18px",
                        background: "var(--c-surface)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 12,
                        }}
                      >
                        <span style={{ fontSize: 15, fontWeight: 600 }}>
                          {pr.name}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 5,
                            color: k.c ? GREEN : "var(--c-text3)",
                            background: k.c
                              ? "rgba(108,174,142,.12)"
                              : "var(--c-tile)",
                          }}
                        >
                          {k.c ? "Connected" : "Not connected"}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <input
                          value={k.v}
                          onChange={(e) =>
                            actions.onKeyInput(
                              pr.id as ProviderId,
                              e.target.value,
                            )
                          }
                          placeholder={pr.ph}
                          type="password"
                          style={{
                            flex: 1,
                            background: "var(--c-surface)",
                            border: "1px solid var(--c-borderStrong)",
                            borderRadius: 8,
                            padding: "9px 13px",
                            fontSize: 13,
                            fontFamily: "var(--font-jetbrains-mono), monospace",
                          }}
                        />
                        <button
                          onClick={() =>
                            actions.validateKey(pr.id as ProviderId)
                          }
                          style={{
                            border: `1px solid ${k.c ? "var(--c-borderStrong)" : PRIMARY}`,
                            background: k.c ? "transparent" : PRIMARY,
                            color: k.c
                              ? "var(--c-text2)"
                              : "var(--c-primaryText)",
                            borderRadius: 8,
                            fontSize: 12.5,
                            fontWeight: 600,
                            padding: "9px 15px",
                          }}
                        >
                          {k.c ? "Re-validate" : "Validate"}
                        </button>
                        {k.c && (
                          <Hoverable
                            as="button"
                            onClick={() =>
                              actions.openConfirmDialog({
                                kind: "removeKey",
                                providerId: pr.id as ProviderId,
                              })
                            }
                            style={{
                              background: "none",
                              border: "1px solid var(--c-borderStrong)",
                              borderRadius: 8,
                              color: "var(--c-text3)",
                              fontSize: 12.5,
                              padding: "9px 13px",
                            }}
                            hoverStyle={{
                              color: "#d47a7a",
                              borderColor: "#4a2626",
                            }}
                          >
                            Remove
                          </Hoverable>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {state.settingsTab === "instructions" && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <h2
                  style={{
                    margin: "0 0 6px",
                    fontFamily: "var(--font-newsreader), serif",
                    fontWeight: 500,
                    fontSize: 23,
                  }}
                >
                  Per-platform instructions
                </h2>
                <Hoverable
                  as="button"
                  onClick={() =>
                    actions.openConfirmDialog({ kind: "resetInstructions" })
                  }
                  style={{
                    flex: "none",
                    background: "none",
                    border: "1px solid var(--c-borderStrong)",
                    borderRadius: 8,
                    color: "var(--c-text3)",
                    fontSize: 12.5,
                    padding: "7px 12px",
                    marginTop: 2,
                  }}
                  hoverStyle={{
                    borderColor: "var(--c-borderHover)",
                    color: "var(--c-text)",
                  }}
                >
                  Reset to defaults
                </Hoverable>
              </div>
              <p
                style={{
                  margin: "0 0 20px",
                  color: "var(--c-text3)",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                Tone, structure, and formatting rules Genora follows for each
                platform. Override any of these per post.
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
              >
                {ORDER.map((id) => {
                  const open = state.instrOpen === id;
                  return (
                    <div
                      key={id}
                      style={{
                        border: "1px solid var(--c-borderStrong)",
                        borderRadius: 12,
                        overflow: "hidden",
                        background: "var(--c-surface)",
                      }}
                    >
                      <Hoverable
                        as="button"
                        onClick={() => actions.toggleInstr(id)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 11,
                          background: "none",
                          border: "none",
                          padding: "14px 16px",
                          textAlign: "left",
                        }}
                        hoverStyle={{ background: "var(--c-popover)" }}
                      >
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "var(--font-jetbrains-mono), monospace",
                            fontSize: 9.5,
                            fontWeight: 600,
                            background: PLAT[id].bg,
                            color: PLAT[id].color,
                          }}
                        >
                          {PLAT[id].mono}
                        </span>
                        <span
                          style={{ flex: 1, fontSize: 14.5, fontWeight: 500 }}
                        >
                          {PLAT[id].label}
                        </span>
                        <span style={{ color: "var(--c-text5)", fontSize: 11 }}>
                          {open ? "▲" : "▼"}
                        </span>
                      </Hoverable>
                      {open && (
                        <div
                          style={{
                            padding: "0 16px 16px",
                            animation: "ffade .15s ease",
                          }}
                        >
                          <textarea
                            value={state.instr[id]}
                            onChange={(e) => actions.onInstr(id, e.target.value)}
                            style={{
                              width: "100%",
                              background: "var(--c-surface)",
                              border: "1px solid var(--c-borderStrong)",
                              borderRadius: 8,
                              resize: "vertical",
                              fontSize: 13.5,
                              lineHeight: 1.55,
                              color: "var(--c-text2)",
                              padding: 13,
                              minHeight: 96,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {state.settingsTab === "voice" && (
            <>
              <h2
                style={{
                  margin: "0 0 6px",
                  fontFamily: "var(--font-newsreader), serif",
                  fontWeight: 500,
                  fontSize: 23,
                }}
              >
                Voice calibration
              </h2>
              <p
                style={{
                  margin: "0 0 20px",
                  color: "var(--c-text3)",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                Paste a few of your own past posts. Genora studies your rhythm
                and word choice so generations sound like you, not a template.
              </p>
              <textarea
                value={state.voice}
                onChange={(e) => actions.onVoice(e.target.value)}
                placeholder="Paste 2–3 past posts here…"
                style={{
                  width: "100%",
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-borderStrong)",
                  borderRadius: 12,
                  resize: "vertical",
                  fontFamily: "var(--font-newsreader), serif",
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: "var(--c-text2)",
                  padding: 18,
                  minHeight: 220,
                }}
              />
              <div
                style={{
                  marginTop: 12,
                  fontSize: 12.5,
                  color: "var(--c-text4)",
                }}
              >
                {derived.voiceStatus}
              </div>
            </>
          )}

          {state.settingsTab === "slop" && (
            <>
              <h2
                style={{
                  margin: "0 0 6px",
                  fontFamily: "var(--font-newsreader), serif",
                  fontWeight: 500,
                  fontSize: 23,
                }}
              >
                Slop Guard
              </h2>
              <p
                style={{
                  margin: "0 0 20px",
                  color: "var(--c-text3)",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                Genora refuses to generate from input with no real thought
                behind it. Set how hard it pushes back.
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: "1px solid var(--c-borderStrong)",
                  borderRadius: 12,
                  padding: "15px 18px",
                  marginBottom: 18,
                  background: "var(--c-surface)",
                }}
              >
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 500 }}>
                    Slop Guard enabled
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "var(--c-text4)",
                      marginTop: 3,
                    }}
                  >
                    {state.blockedCount} low-substance drafts turned away so
                    far
                  </div>
                </div>
                <button
                  onClick={actions.toggleSlop}
                  style={{
                    width: 44,
                    height: 25,
                    borderRadius: 999,
                    border: "none",
                    padding: 0,
                    position: "relative",
                    background: state.slopEnabled
                      ? PRIMARY
                      : "var(--c-borderStrong)",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 3,
                      left: state.slopEnabled ? 22 : 3,
                      width: 19,
                      height: 19,
                      borderRadius: "50%",
                      background: state.slopEnabled
                        ? "var(--c-primaryText)"
                        : "var(--c-shell)",
                      transition: "left .16s ease",
                    }}
                  />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {SLOP_OPTIONS.map((o) => {
                  const selected = state.slopStrictness === o.id;
                  return (
                    <button
                      key={o.id}
                      onClick={() => actions.setSlopStrictness(o.id)}
                      style={strictOptStyle(selected)}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 3,
                          textAlign: "left",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14.5,
                            fontWeight: 500,
                            color: "var(--c-text)",
                          }}
                        >
                          {o.label}
                        </span>
                        <span
                          style={{
                            fontSize: 12.5,
                            color: "var(--c-text3)",
                            lineHeight: 1.4,
                          }}
                        >
                          {o.desc}
                        </span>
                      </div>
                      <span style={radioStyle(selected)} />
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {state.settingsTab === "model" && (
            <>
              <h2
                style={{
                  margin: "0 0 6px",
                  fontFamily: "var(--font-newsreader), serif",
                  fontWeight: 500,
                  fontSize: 23,
                }}
              >
                Default model
              </h2>
              <p
                style={{
                  margin: "0 0 20px",
                  color: "var(--c-text3)",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {derived.modelPageNote}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {MODELS.map((m) => {
                  const locked = !m.free && !derived.hasKey;
                  const selected = state.model === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => actions.pickModel(m)}
                      style={modelItemStyle(selected)}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14.5,
                            fontWeight: 500,
                            color: locked ? "var(--c-text5)" : "var(--c-text)",
                          }}
                        >
                          {m.label}
                        </span>
                        <span
                          style={{
                            fontSize: 9.5,
                            fontWeight: 600,
                            color: locked
                              ? "var(--c-text5)"
                              : m.free
                                ? GREEN
                                : "var(--c-text2)",
                            border: "1px solid var(--c-borderHover)",
                            borderRadius: 4,
                            padding: "1px 6px",
                          }}
                        >
                          {locked ? "Locked" : m.tag}
                        </span>
                      </span>
                      <span style={radioStyle(selected)} />
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
