"use client";

import { useRef, useState } from "react";
import { PLAT } from "@/lib/genora/data";
import type { PlatformId } from "@/lib/genora/types";
import type {
  GenoraActions,
  GenoraDisplayState,
} from "@/lib/genora/useGenoraController";
import { usePopoverDismiss } from "@/hooks/usePopoverDismiss";
import { ButtonSpinner } from "./ButtonSpinner";
import { Hoverable } from "./Hoverable";
import { Skeleton } from "./Skeleton";
import { PRIMARY, RED, popoverStyle } from "./styleHelpers";
import type { GenoraViewProps } from "./viewProps";

type OutputViewMode = "tabs" | "sideBySide";

const FORMAT_HINTS: Record<PlatformId, (len: number) => string> = {
  linkedin: () => "LinkedIn · hooks + whitespace, minimal hashtags",
  x: (len) => `X · one idea, ${len} / 280 characters`,
  reddit: () => "Reddit · conversational, ends on a question",
  medium: () => "Medium · long-form essay with a title",
  substack: () => "Substack · warm newsletter voice",
};

export function OutputView({
  state,
  derived,
  loading,
  actions,
}: GenoraViewProps) {
  const showOutput = !state.generating && !loading.postDetail;
  const [viewMode, setViewMode] = useState<OutputViewMode>("tabs");
  const canSideBySide = state.outPlatforms.length > 1;
  const activeFailed = state.outputStatus[state.activeTab] === "failed";
  const activeRegenerating = state.regeneratingPlatforms.has(state.activeTab);
  const historyRef = useRef<HTMLDivElement>(null);
  usePopoverDismiss(historyRef, state.historyOpen === state.activeTab, () =>
    actions.openHistory(),
  );

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
          title="Home"
          onClick={actions.goDash}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            flex: "none",
            background: "none",
            border: "none",
            borderRadius: 8,
            color: "var(--c-text3)",
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
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Hoverable>
        <Hoverable
          as="button"
          onClick={actions.backToCompose}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "var(--c-surface)",
            border: "1px solid var(--c-borderStrong)",
            borderRadius: 8,
            padding: "6px 12px",
            color: "var(--c-text2)",
            fontSize: 12.5,
          }}
          hoverStyle={{
            borderColor: "var(--c-borderHover)",
            color: "var(--c-text)",
          }}
        >
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
                  : "var(--c-text)",
            }}
          />
          <span style={{ fontSize: 12, color: "var(--c-text3)" }}>
            {derived.quotaText}
          </span>
        </div>
      </header>

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
          <div style={{ marginBottom: 22 }}>
            <ButtonSpinner size={26} color="var(--c-text)" />
          </div>
          <div
            style={{
              fontFamily: "var(--font-newsreader), serif",
              fontSize: 19,
              marginBottom: 26,
              color: "var(--c-text2)",
            }}
          >
            {derived.genCountText}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              minWidth: 300,
            }}
          >
            {state.outPlatforms.map((id) => {
              const platStatus = state.outputStatus[id] ?? "pending";
              return (
                <div
                  key={id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    fontSize: 13.5,
                    color: "var(--c-text2)",
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
                  <span style={{ flex: 1 }}>
                    {platStatus === "success"
                      ? `${PLAT[id].label} done`
                      : platStatus === "failed"
                        ? state.outputError[id] || `${PLAT[id].label} failed`
                        : `Shaping for ${PLAT[id].label}…`}
                  </span>
                  {platStatus === "pending" && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--c-text)",
                        animation: "fpulse 1s ease infinite",
                      }}
                    />
                  )}
                  {platStatus === "success" && (
                    <span style={{ color: "#6cae8e", fontSize: 13 }}>✓</span>
                  )}
                  {platStatus === "failed" && (
                    <Hoverable
                      as="button"
                      onClick={() => actions.retryPlatform(id)}
                      disabled={state.regeneratingPlatforms.has(id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "none",
                        border: "1px solid var(--c-borderStrong)",
                        borderRadius: 6,
                        color: RED,
                        fontSize: 11.5,
                        padding: "3px 9px",
                        flex: "none",
                      }}
                      hoverStyle={{ borderColor: RED }}
                    >
                      {state.regeneratingPlatforms.has(id) && (
                        <ButtonSpinner size={10} color={RED} />
                      )}
                      Retry
                    </Hoverable>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!state.generating && loading.postDetail && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            padding: "20px 28px",
          }}
        >
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} width={86} height={30} radius={8} />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              maxWidth: 640,
            }}
          >
            <Skeleton width="90%" height={16} />
            <Skeleton width="100%" height={16} />
            <Skeleton width="100%" height={16} />
            <Skeleton width="70%" height={16} />
            <Skeleton width="85%" height={16} />
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
              alignItems: "center",
              gap: 2,
              padding: "0 20px 0 28px",
              borderBottom: "1px solid var(--c-border)",
            }}
          >
            {viewMode === "tabs" &&
              state.outPlatforms.map((id) => {
                const active = state.activeTab === id;
                const content = state.content[id] || "";
                const limit = PLAT[id].limit;
                const over = limit ? content.length > limit : false;
                const failed = state.outputStatus[id] === "failed";
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
                      borderBottom: `2px solid ${active ? "var(--c-text)" : "transparent"}`,
                      padding: "14px 16px 12px",
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: active ? "var(--c-text)" : "var(--c-text3)",
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
                        color: active ? PLAT[id].color : "var(--c-text3)",
                      }}
                    >
                      {PLAT[id].mono}
                    </span>
                    {PLAT[id].label}
                    {failed ? (
                      <span
                        title="This platform failed to generate"
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: RED,
                          flex: "none",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                          fontSize: 10.5,
                          color: over ? RED : "var(--c-text5)",
                        }}
                      >
                        {limit ? `${content.length}/${limit}` : content.length}
                      </span>
                    )}
                  </button>
                );
              })}
            <div style={{ flex: 1 }} />
            {canSideBySide && (
              <div
                style={{
                  display: "flex",
                  gap: 2,
                  background: "var(--c-tile)",
                  border: "1px solid var(--c-borderStrong)",
                  borderRadius: 8,
                  padding: 2,
                  marginBottom: 8,
                }}
              >
                <Hoverable
                  as="button"
                  title="One at a time"
                  onClick={() => setViewMode("tabs")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 26,
                    background:
                      viewMode === "tabs" ? "var(--c-surface)" : "none",
                    border: "none",
                    borderRadius: 6,
                    color:
                      viewMode === "tabs" ? "var(--c-text)" : "var(--c-text4)",
                  }}
                  hoverStyle={{ color: "var(--c-text)" }}
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
                    <rect x="4" y="5" width="16" height="14" rx="2" />
                  </svg>
                </Hoverable>
                <Hoverable
                  as="button"
                  title="Side by side"
                  onClick={() => setViewMode("sideBySide")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 26,
                    background:
                      viewMode === "sideBySide" ? "var(--c-surface)" : "none",
                    border: "none",
                    borderRadius: 6,
                    color:
                      viewMode === "sideBySide"
                        ? "var(--c-text)"
                        : "var(--c-text4)",
                  }}
                  hoverStyle={{ color: "var(--c-text)" }}
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
                    <rect x="3" y="5" width="7" height="14" rx="1.5" />
                    <rect x="14" y="5" width="7" height="14" rx="1.5" />
                  </svg>
                </Hoverable>
              </div>
            )}
          </div>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: viewMode === "tabs" ? "flex" : "none",
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
                    color: "var(--c-text4)",
                  }}
                >
                  {FORMAT_HINTS[state.activeTab](derived.alen)}
                </span>
                <div ref={historyRef} style={{ position: "relative" }}>
                  <Hoverable
                    as="button"
                    aria-haspopup="menu"
                    aria-expanded={state.historyOpen === state.activeTab}
                    onClick={() => actions.openHistory()}
                    style={{
                      display: "flex",
                      gap: 6,
                      alignItems: "center",
                      background: "none",
                      border: "1px solid var(--c-borderStrong)",
                      borderRadius: 7,
                      color: "var(--c-text3)",
                      fontSize: 12,
                      padding: "5px 10px",
                    }}
                    hoverStyle={{
                      borderColor: "var(--c-borderHover)",
                      color: "var(--c-text2)",
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
                  {state.historyOpen === state.activeTab && (
                    <div
                      role="menu"
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
                          color: "var(--c-text5)",
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
                          <Hoverable
                            key={i}
                            as="button"
                            role="menuitem"
                            onClick={() =>
                              actions.restoreVersion(
                                state.activeTab,
                                versionIdx,
                              )
                            }
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 10,
                              width: "100%",
                              background: current
                                ? "var(--c-surfaceHover)"
                                : "transparent",
                              border: "none",
                              borderRadius: 7,
                              padding: "8px 9px",
                            }}
                            hoverStyle={{ background: "var(--c-surfaceHover)" }}
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
                                style={{
                                  fontSize: 12.5,
                                  color: "var(--c-text2)",
                                }}
                              >
                                Version {versionIdx}
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "var(--c-text5)",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {t.slice(0, 40).replace(/\n/g, " ")}…
                              </span>
                            </span>
                            <span
                              style={{ fontSize: 11, color: "var(--c-text3)" }}
                            >
                              {current ? "current" : "restore"}
                            </span>
                          </Hoverable>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              {activeFailed ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 14,
                    background: "var(--c-surface)",
                    border: `1px solid ${RED}`,
                    borderRadius: 12,
                    padding: 24,
                    minHeight: 300,
                    flex: 1,
                  }}
                >
                  <span style={{ fontSize: 13.5, color: RED, fontWeight: 600 }}>
                    {PLAT[state.activeTab].label} didn&apos;t generate
                  </span>
                  <span
                    style={{
                      fontSize: 13.5,
                      color: "var(--c-text2)",
                      lineHeight: 1.5,
                    }}
                  >
                    {state.outputError[state.activeTab] ||
                      "Something went wrong generating this platform."}
                  </span>
                  <span style={{ fontSize: 12.5, color: "var(--c-text4)" }}>
                    The other platforms you selected aren&apos;t affected — you
                    can retry just this one.
                  </span>
                  <Hoverable
                    as="button"
                    onClick={() => actions.retryPlatform(state.activeTab)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "none",
                      border: "1px solid var(--c-borderStrong)",
                      borderRadius: 8,
                      color: "var(--c-text2)",
                      fontSize: 13,
                      padding: "9px 15px",
                    }}
                    hoverStyle={{
                      background: "var(--c-popover)",
                      borderColor: "var(--c-borderHover)",
                    }}
                  >
                    Retry {PLAT[state.activeTab].label}
                  </Hoverable>
                </div>
              ) : activeRegenerating && !derived.activeContent ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 14,
                    background: "var(--c-surface)",
                    border: "1px solid var(--c-borderStrong)",
                    borderRadius: 12,
                    padding: 24,
                    minHeight: 300,
                    flex: 1,
                  }}
                >
                  <ButtonSpinner size={20} />
                  <span style={{ fontSize: 13.5, color: "var(--c-text2)" }}>
                    Regenerating {PLAT[state.activeTab].label}…
                  </span>
                </div>
              ) : (
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
                    color: "var(--c-text)",
                    padding: 20,
                    minHeight: 300,
                    flex: 1,
                  }}
                />
              )}
              {!activeFailed && derived.isReddit && (
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
                      color: "var(--c-text4)",
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
              {!activeFailed && (
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
                    onClick={() => actions.regenerate()}
                    disabled={activeRegenerating}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "none",
                      border: "1px solid var(--c-borderStrong)",
                      borderRadius: 8,
                      color: "var(--c-text2)",
                      fontSize: 13,
                      padding: "9px 15px",
                      ...(activeRegenerating && { cursor: "not-allowed" }),
                    }}
                    hoverStyle={{
                      background: "var(--c-popover)",
                      borderColor: "var(--c-borderHover)",
                    }}
                  >
                    {activeRegenerating ? (
                      <ButtonSpinner size={13} />
                    ) : (
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
                    )}
                    {activeRegenerating ? "Regenerating…" : "Regenerate"}
                  </Hoverable>
                  <Hoverable
                    as="button"
                    onClick={() => actions.copyText()}
                    style={{
                      background: "none",
                      border: "1px solid var(--c-borderStrong)",
                      borderRadius: 8,
                      color: "var(--c-text2)",
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
                      color: "var(--c-text5)",
                      textAlign: "right",
                      maxWidth: 210,
                      lineHeight: 1.35,
                    }}
                  >
                    {derived.activeMeta.share === "copyopen"
                      ? "No prefill API — Genora copies the text and opens a new tab to paste."
                      : derived.activeMeta.sub
                        ? "Reddit is subreddit-scoped — pick where to post first."
                        : "Opens the composer with your text already filled in."}
                  </span>
                  <button
                    onClick={() => actions.doShare()}
                    style={{
                      border: "none",
                      borderRadius: 8,
                      padding: "9px 17px",
                      fontSize: 13,
                      fontWeight: 600,
                      ...(derived.shareReady
                        ? { background: PRIMARY, color: "var(--c-primaryText)" }
                        : {
                            background: "var(--c-popover)",
                            color: "var(--c-text5)",
                            cursor: "not-allowed",
                          }),
                    }}
                  >
                    {derived.activeMeta.share === "copyopen"
                      ? `Copy & open ${derived.activeMeta.label}`
                      : `Open in ${derived.activeMeta.label}`}
                  </button>
                </div>
              )}
            </div>
          </div>

          {viewMode === "sideBySide" && (
            <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
              <div
                style={{ display: "flex", gap: 16, minWidth: "min-content" }}
              >
                {state.outPlatforms.map((id) => (
                  <PlatformPanel
                    key={id}
                    id={id}
                    state={state}
                    actions={actions}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlatformPanel({
  id,
  state,
  actions,
}: {
  id: PlatformId;
  state: GenoraDisplayState;
  actions: GenoraActions;
}) {
  const meta = PLAT[id];
  const content = state.content[id] || "";
  const alen = content.length;
  const isReddit = meta.share === "prefill" && !!meta.sub;
  const shareReady = !(isReddit && !state.redditSub.trim());
  const vArr = state.versions[id] || [];
  const versionLabel = "v" + Math.max(1, vArr.length);
  const historyOpenHere = state.historyOpen === id;
  const historyRef = useRef<HTMLDivElement>(null);
  usePopoverDismiss(historyRef, historyOpenHere, () => actions.openHistory(id));
  const limit = meta.limit;
  const over = limit ? alen > limit : false;
  const failed = state.outputStatus[id] === "failed";
  const regenerating = state.regeneratingPlatforms.has(id);

  return (
    <div
      style={{
        width: 360,
        flex: "none",
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${failed ? RED : "var(--c-border)"}`,
        borderRadius: 12,
        padding: 16,
        background: "var(--c-surface)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
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
            background: meta.bg,
            color: meta.color,
          }}
        >
          {meta.mono}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{meta.label}</span>
        {failed ? (
          <span style={{ marginLeft: "auto", fontSize: 11, color: RED }}>
            failed
          </span>
        ) : (
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 10.5,
              color: over ? RED : "var(--c-text5)",
            }}
          >
            {limit ? `${alen}/${limit}` : alen}
          </span>
        )}
      </div>
      {failed && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            background: "var(--c-canvas)",
            border: `1px solid ${RED}`,
            borderRadius: 10,
            padding: 14,
            marginBottom: 10,
            fontSize: 12.5,
            color: "var(--c-text2)",
          }}
        >
          <span>
            {state.outputError[id] || "This platform didn't generate."}
          </span>
          <Hoverable
            as="button"
            onClick={() => actions.retryPlatform(id)}
            style={{
              alignSelf: "flex-start",
              background: "none",
              border: "1px solid var(--c-borderStrong)",
              borderRadius: 7,
              color: "var(--c-text2)",
              fontSize: 12,
              padding: "6px 11px",
            }}
            hoverStyle={{ borderColor: RED }}
          >
            Retry
          </Hoverable>
        </div>
      )}
      {regenerating && !content && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--c-canvas)",
            border: "1px solid var(--c-borderStrong)",
            borderRadius: 10,
            padding: 14,
            marginBottom: 10,
            fontSize: 12.5,
            color: "var(--c-text2)",
          }}
        >
          <ButtonSpinner size={14} />
          <span>Regenerating…</span>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 10,
            color: "var(--c-text4)",
          }}
        >
          {FORMAT_HINTS[id](alen)}
        </span>
        <div ref={historyRef} style={{ position: "relative" }}>
          <Hoverable
            as="button"
            aria-haspopup="menu"
            aria-expanded={historyOpenHere}
            onClick={() => actions.openHistory(id)}
            style={{
              display: "flex",
              gap: 5,
              alignItems: "center",
              background: "none",
              border: "1px solid var(--c-borderStrong)",
              borderRadius: 7,
              color: "var(--c-text3)",
              fontSize: 11,
              padding: "4px 8px",
            }}
            hoverStyle={{
              borderColor: "var(--c-borderHover)",
              color: "var(--c-text2)",
            }}
          >
            {versionLabel}
          </Hoverable>
          {historyOpenHere && (
            <div
              role="menu"
              style={{
                ...popoverStyle,
                top: 30,
                right: 0,
                left: "auto",
                minWidth: 230,
              }}
            >
              <div
                style={{
                  fontSize: 10.5,
                  color: "var(--c-text5)",
                  padding: "5px 9px 7px",
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                }}
              >
                Version history · non-destructive
              </div>
              {[...vArr].reverse().map((t, i) => {
                const versionIdx = vArr.length - i;
                const current = t === content;
                return (
                  <Hoverable
                    key={i}
                    as="button"
                    role="menuitem"
                    onClick={() => actions.restoreVersion(id, versionIdx)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      width: "100%",
                      background: current
                        ? "var(--c-surfaceHover)"
                        : "transparent",
                      border: "none",
                      borderRadius: 7,
                      padding: "8px 9px",
                    }}
                    hoverStyle={{ background: "var(--c-surfaceHover)" }}
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
                      <span style={{ fontSize: 12.5, color: "var(--c-text2)" }}>
                        Version {versionIdx}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--c-text5)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {t.slice(0, 40).replace(/\n/g, " ")}…
                      </span>
                    </span>
                    <span style={{ fontSize: 11, color: "var(--c-text3)" }}>
                      {current ? "current" : "restore"}
                    </span>
                  </Hoverable>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {!failed && !(regenerating && !content) && (
        <textarea
          value={content}
          onChange={(e) => actions.onEditContent(e.target.value, id)}
          onFocus={() => {
            if (state.activeTab !== id) actions.selectTab(id);
          }}
          style={{
            background: "var(--c-canvas)",
            border: "1px solid var(--c-borderStrong)",
            borderRadius: 10,
            resize: "none",
            fontFamily: "var(--font-newsreader), serif",
            fontSize: 14.5,
            lineHeight: 1.55,
            color: "var(--c-text)",
            padding: 14,
            minHeight: 260,
            flex: 1,
          }}
        />
      )}

      {!failed && isReddit && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 10,
            background: "var(--c-canvas)",
            border: "1px solid var(--c-borderStrong)",
            borderRadius: 9,
            padding: "8px 11px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 12,
              color: "var(--c-text4)",
            }}
          >
            r/
          </span>
          <input
            value={state.redditSub}
            onChange={(e) => actions.onRedditSub(e.target.value)}
            placeholder="subreddit"
            style={{
              flex: 1,
              background: "none",
              border: "none",
              fontSize: 12.5,
            }}
          />
        </div>
      )}

      {!failed && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 12,
          }}
        >
          <Hoverable
            as="button"
            onClick={() => actions.regenerate(id)}
            disabled={regenerating}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "none",
              border: "1px solid var(--c-borderStrong)",
              borderRadius: 8,
              color: "var(--c-text2)",
              fontSize: 12,
              padding: "7px 11px",
              ...(regenerating && { cursor: "not-allowed" }),
            }}
            hoverStyle={{
              background: "var(--c-popover)",
              borderColor: "var(--c-borderHover)",
            }}
          >
            {regenerating && <ButtonSpinner size={11} />}
            {regenerating ? "Regenerating…" : "Regenerate"}
          </Hoverable>
          <Hoverable
            as="button"
            onClick={() => actions.copyText(id)}
            style={{
              background: "none",
              border: "1px solid var(--c-borderStrong)",
              borderRadius: 8,
              color: "var(--c-text2)",
              fontSize: 12,
              padding: "7px 11px",
            }}
            hoverStyle={{
              background: "var(--c-popover)",
              borderColor: "var(--c-borderHover)",
            }}
          >
            Copy
          </Hoverable>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => actions.doShare(id)}
            disabled={!shareReady}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "7px 12px",
              fontSize: 12,
              fontWeight: 600,
              ...(shareReady
                ? { background: PRIMARY, color: "var(--c-primaryText)" }
                : {
                    background: "var(--c-popover)",
                    color: "var(--c-text5)",
                    cursor: "not-allowed",
                  }),
            }}
          >
            {meta.share === "copyopen"
              ? "Copy & open"
              : `Open in ${meta.label}`}
          </button>
        </div>
      )}
    </div>
  );
}
