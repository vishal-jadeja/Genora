"use client";

import { PLAT, REJECTS } from "@/lib/facet/data";
import type { PlatformId } from "@/lib/facet/types";
import { Hoverable } from "./Hoverable";
import { PRIMARY, RED, popoverStyle } from "./styleHelpers";
import type { FacetViewProps } from "./viewProps";

const FORMAT_HINTS: Record<PlatformId, (len: number) => string> = {
  linkedin: () => "LinkedIn · hooks + whitespace, minimal hashtags",
  x: (len) => `X · one idea, ${len} / 280 characters`,
  reddit: () => "Reddit · conversational, ends on a question",
  medium: () => "Medium · long-form essay with a title",
  substack: () => "Substack · warm newsletter voice",
};

export function OutputView({ state, derived, actions }: FacetViewProps) {
  const showOutput = !state.slopHard && !state.generating;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "15px 28px",
          borderBottom: "1px solid var(--c-border)",
        }}
      >
        <Hoverable
          as="button"
          onClick={actions.backToCompose}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            color: "#8f8f8f",
            fontSize: 13.5,
          }}
          hoverStyle={{ color: "#ededed" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Editor
        </Hoverable>
        <div style={{ flex: 1, textAlign: "center", overflow: "hidden" }}>
          <span
            style={{
              fontFamily: "var(--font-newsreader), serif",
              fontSize: 16,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {state.outTitle}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: derived.hasKey
                ? "#6cae8e"
                : derived.quotaLow
                  ? "#d4a960"
                  : "#ededed",
            }}
          />
          <span style={{ fontSize: 12, color: "#8f8f8f" }}>
            {derived.quotaText}
          </span>
        </div>
      </header>

      {state.slopHard && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 40,
            animation: "ffade .35s ease",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 11,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: "#8f8f8f",
              marginBottom: 22,
            }}
          >
            Slop Guard · blocked
          </div>
          <h2
            style={{
              margin: "0 0 14px",
              fontFamily: "var(--font-newsreader), serif",
              fontWeight: 500,
              fontSize: 30,
              letterSpacing: "-.01em",
              maxWidth: 600,
              lineHeight: 1.25,
              fontStyle: "italic",
              color: "#f3f3f3",
            }}
          >
            &ldquo;{REJECTS[state.rejectIdx]}&rdquo;
          </h2>
          <p
            style={{
              margin: "0 0 30px",
              color: "#8f8f8f",
              fontSize: 14.5,
              maxWidth: 430,
              lineHeight: 1.55,
            }}
          >
            Facet won&rsquo;t repurpose what isn&rsquo;t there yet. Add a
            stance, a detail, or an example — then we&rsquo;ll happily reshape
            it for every platform.
          </p>
          <button
            onClick={actions.backToCompose}
            style={{
              background: "#f0f0f0",
              color: "var(--c-shell)",
              border: "none",
              borderRadius: 8,
              padding: "11px 20px",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            ← Back to the draft
          </button>
          <div
            style={{
              marginTop: 44,
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 11,
              color: "#3f3f3f",
              letterSpacing: ".04em",
            }}
          >
            {state.blockedCount} attempts blocked · you&rsquo;re welcome
          </div>
        </div>
      )}

      {state.generating && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 40,
            animation: "ffade .3s ease",
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              border: "2px solid var(--c-borderStrong)",
              borderTopColor: "#ededed",
              borderRadius: "50%",
              animation: "fspin .8s linear infinite",
              marginBottom: 22,
            }}
          />
          <div
            style={{
              fontFamily: "var(--font-newsreader), serif",
              fontSize: 19,
              marginBottom: 26,
              color: "#d6d6d6",
            }}
          >
            {derived.genCountText}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              minWidth: 260,
            }}
          >
            {state.outPlatforms.map((id) => (
              <div
                key={id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 13.5,
                  color: "#9a9a9a",
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: 8.5,
                    fontWeight: 600,
                    background: PLAT[id].bg,
                    color: PLAT[id].color,
                  }}
                >
                  {PLAT[id].mono}
                </span>
                <span style={{ flex: 1 }}>Shaping for {PLAT[id].label}…</span>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#ededed",
                    animation: "fpulse 1s ease infinite",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {showOutput && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 2,
              padding: "0 28px",
              borderBottom: "1px solid var(--c-border)",
            }}
          >
            {state.outPlatforms.map((id) => {
              const active = state.activeTab === id;
              const content = state.content[id] || "";
              const limit = PLAT[id].limit;
              const over = limit ? content.length > limit : false;
              return (
                <button
                  key={id}
                  onClick={() => actions.selectTab(id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "none",
                    border: "none",
                    borderBottom: `2px solid ${active ? "#ededed" : "transparent"}`,
                    padding: "14px 16px 12px",
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: active ? "#ededed" : "#8f8f8f",
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: 8,
                      fontWeight: 600,
                      background: active ? PLAT[id].bg : "var(--c-tile)",
                      color: active ? PLAT[id].color : "#8f8f8f",
                    }}
                  >
                    {PLAT[id].mono}
                  </span>
                  {PLAT[id].label}
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: 10.5,
                      color: over ? RED : "#565656",
                    }}
                  >
                    {limit ? `${content.length}/${limit}` : content.length}
                  </span>
                </button>
              );
            })}
          </div>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 640,
                padding: "28px 28px 40px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: 11,
                    color: "#6b6b6b",
                  }}
                >
                  {FORMAT_HINTS[state.activeTab](derived.alen)}
                </span>
                <div style={{ position: "relative" }}>
                  <Hoverable
                    as="button"
                    onClick={actions.openHistory}
                    style={{
                      display: "flex",
                      gap: 6,
                      alignItems: "center",
                      background: "none",
                      border: "1px solid var(--c-borderStrong)",
                      borderRadius: 7,
                      color: "#8f8f8f",
                      fontSize: 12,
                      padding: "5px 10px",
                    }}
                    hoverStyle={{
                      borderColor: "var(--c-borderHover)",
                      color: "#c4c4c4",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                      <path d="M3 4v4h4" />
                    </svg>
                    {derived.versionLabel}
                  </Hoverable>
                  {state.historyOpen && (
                    <div
                      style={{
                        ...popoverStyle,
                        top: 34,
                        right: 0,
                        left: "auto",
                        minWidth: 250,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10.5,
                          color: "#565656",
                          padding: "5px 9px 7px",
                          letterSpacing: ".06em",
                          textTransform: "uppercase",
                        }}
                      >
                        Version history · non-destructive
                      </div>
                      {[...derived.vArr].reverse().map((t, i) => {
                        const versionIdx = derived.vArr.length - i;
                        const current = t === derived.activeContent;
                        return (
                          <button
                            key={i}
                            onClick={() =>
                              actions.restoreVersion(state.activeTab, t)
                            }
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 10,
                              width: "100%",
                              background: current
                                ? "var(--c-borderStrong)"
                                : "none",
                              border: "none",
                              borderRadius: 7,
                              padding: "8px 9px",
                            }}
                          >
                            <span
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                                textAlign: "left",
                                overflow: "hidden",
                              }}
                            >
                              <span
                                style={{ fontSize: 12.5, color: "#d6d6d6" }}
                              >
                                Version {versionIdx}
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "#565656",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {t.slice(0, 40).replace(/\n/g, " ")}…
                              </span>
                            </span>
                            <span style={{ fontSize: 11, color: "#8f8f8f" }}>
                              {current ? "current" : "restore"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <textarea
                value={derived.activeContent}
                onChange={(e) => actions.onEditContent(e.target.value)}
                style={{
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-borderStrong)",
                  borderRadius: 12,
                  resize: "none",
                  fontFamily: "var(--font-newsreader), serif",
                  fontSize: 16.5,
                  lineHeight: 1.6,
                  color: "#e2e2e2",
                  padding: 20,
                  minHeight: 300,
                  flex: 1,
                }}
              />
              {derived.isReddit && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 14,
                    background: "var(--c-surface)",
                    border: "1px solid var(--c-borderStrong)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    animation: "ffade .2s ease",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: 13,
                      color: "#6b6b6b",
                    }}
                  >
                    r/
                  </span>
                  <input
                    value={state.redditSub}
                    onChange={(e) => actions.onRedditSub(e.target.value)}
                    placeholder="subreddit (required — Reddit posts are subreddit-scoped)"
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      fontSize: 13.5,
                    }}
                  />
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 16,
                }}
              >
                <Hoverable
                  as="button"
                  onClick={actions.regenerate}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "none",
                    border: "1px solid var(--c-borderStrong)",
                    borderRadius: 8,
                    color: "#c4c4c4",
                    fontSize: 13,
                    padding: "9px 15px",
                  }}
                  hoverStyle={{
                    background: "var(--c-popover)",
                    borderColor: "var(--c-borderHover)",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
                    <path d="M21 4v4h-4" />
                  </svg>
                  Regenerate
                </Hoverable>
                <Hoverable
                  as="button"
                  onClick={actions.copyText}
                  style={{
                    background: "none",
                    border: "1px solid var(--c-borderStrong)",
                    borderRadius: 8,
                    color: "#c4c4c4",
                    fontSize: 13,
                    padding: "9px 15px",
                  }}
                  hoverStyle={{
                    background: "var(--c-popover)",
                    borderColor: "var(--c-borderHover)",
                  }}
                >
                  Copy
                </Hoverable>
                <div style={{ flex: 1 }} />
                <span
                  style={{
                    fontSize: 11.5,
                    color: "#565656",
                    textAlign: "right",
                    maxWidth: 210,
                    lineHeight: 1.35,
                  }}
                >
                  {derived.activeMeta.share === "copyopen"
                    ? "No prefill API — Facet copies the text and opens a new tab to paste."
                    : derived.activeMeta.sub
                      ? "Reddit is subreddit-scoped — pick where to post first."
                      : "Opens the composer with your text already filled in."}
                </span>
                <button
                  onClick={actions.doShare}
                  style={{
                    border: "none",
                    borderRadius: 8,
                    padding: "9px 17px",
                    fontSize: 13,
                    fontWeight: 600,
                    ...(derived.shareReady
                      ? { background: PRIMARY, color: "var(--c-shell)" }
                      : {
                          background: "var(--c-popover)",
                          color: "#565656",
                          cursor: "not-allowed",
                        }),
                  }}
                >
                  {derived.activeMeta.share === "copyopen"
                    ? `Copy & open ${derived.activeMeta.label}`
                    : `Open in ${derived.activeMeta.label}`}
                </button>
              </div>
              {!!state.flashMsg && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--c-surfaceHover)",
                    border: "1px solid var(--c-borderHover)",
                    borderRadius: 9,
                    padding: "10px 16px",
                    fontSize: 13,
                    color: "#ededed",
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    boxShadow: "0 10px 28px rgba(0,0,0,.6)",
                    animation: "ffade .2s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#6cae8e",
                    }}
                  />
                  {state.flashMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
