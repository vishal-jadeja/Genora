"use client";

import { useRef } from "react";
import { MODELS, ORDER, PLAT, REJECTS } from "@/lib/genora/data";
import { usePopoverDismiss } from "@/hooks/usePopoverDismiss";
import { ButtonSpinner } from "./ButtonSpinner";
import { Hoverable } from "./Hoverable";
import { Skeleton, SkeletonText } from "./Skeleton";
import {
  AMBER,
  GREEN,
  PRIMARY,
  RED,
  chipStyle,
  monoStyle,
  optStyle,
  popoverStyle,
} from "./styleHelpers";
import type { GenoraViewProps } from "./viewProps";

export function ComposeView({
  state,
  derived,
  loading,
  actions,
}: GenoraViewProps) {
  const composeFolderOptions = [
    { id: null as string | null, name: "No folder" },
    ...state.folders.map((f) => ({ id: f.id, name: f.name })),
  ];

  const folderPickerRef = useRef<HTMLDivElement>(null);
  usePopoverDismiss(
    folderPickerRef,
    state.folderPickerOpen,
    actions.openFolderPicker,
  );
  const modelPickerRef = useRef<HTMLDivElement>(null);
  usePopoverDismiss(modelPickerRef, state.modelOpen, actions.openModel);

  let substanceColor = RED;
  let substanceLabel = "Needs a stance";
  if (derived.substanceTier === "high") {
    substanceColor = GREEN;
    substanceLabel = "Ready to generate";
  } else if (derived.substanceTier === "mid") {
    substanceColor = AMBER;
    substanceLabel = "A bit thin";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "15px 24px",
          borderBottom: "1px solid var(--c-border)",
        }}
      >
        <Hoverable
          as="button"
          onClick={actions.goDash}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            color: "var(--c-text3)",
            fontSize: 13.5,
          }}
          hoverStyle={{ color: "var(--c-text)" }}
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
          Dashboard
        </Hoverable>
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: state.draftSaving ? "#d4a960" : "#6cae8e",
              animation: state.draftSaving
                ? undefined
                : "fpulse 2.4s ease infinite",
            }}
          />
          <span style={{ fontSize: 12, color: "var(--c-text5)" }}>
            {state.draftSaving
              ? "Saving…"
              : state.composePostId
                ? "Saved · autosaves as you write"
                : "Not saved yet — start typing"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div ref={folderPickerRef} style={{ position: "relative" }}>
            <Hoverable
              as="button"
              aria-haspopup="menu"
              aria-expanded={state.folderPickerOpen}
              onClick={actions.openFolderPicker}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                background: "var(--c-surface)",
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
              <span style={{ color: "var(--c-text5)", fontSize: 9 }}>▾</span>
            </Hoverable>
            {state.folderPickerOpen && (
              <div
                role="menu"
                style={{ ...popoverStyle, top: 40, right: 0, left: "auto" }}
              >
                {composeFolderOptions.map((o) => (
                  <button
                    key={o.id ?? "none"}
                    role="menuitem"
                    onClick={() => actions.pickComposeFolder(o.id)}
                    style={optStyle(state.composeFolder === o.id)}
                  >
                    {o.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div ref={modelPickerRef} style={{ position: "relative" }}>
            <Hoverable
              as="button"
              aria-haspopup="menu"
              aria-expanded={state.modelOpen}
              onClick={actions.openModel}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                background: "var(--c-surface)",
                border: "1px solid var(--c-borderStrong)",
                borderRadius: 8,
                color: "var(--c-text2)",
                fontSize: 12.5,
                padding: "7px 11px",
              }}
              hoverStyle={{ borderColor: "var(--c-borderHover)" }}
            >
              {derived.curModel.label}
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: derived.curModel.free ? GREEN : "var(--c-text2)",
                  border: "1px solid var(--c-borderHover)",
                  borderRadius: 4,
                  padding: "1px 5px",
                }}
              >
                {derived.curModel.free ? "Free" : "BYOK"}
              </span>
              <span style={{ color: "var(--c-text5)", fontSize: 9 }}>▾</span>
            </Hoverable>
            {state.modelOpen && (
              <div
                role="menu"
                style={{
                  ...popoverStyle,
                  top: 40,
                  right: 0,
                  left: "auto",
                  minWidth: 250,
                }}
              >
                {MODELS.map((m) => {
                  const locked = !m.free && !actions.hasKey(m.id);
                  const selected = state.model === m.id;
                  return (
                    <button
                      key={m.id}
                      role="menuitem"
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
                        color: locked ? "var(--c-text5)" : "var(--c-text2)",
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
                                ? GREEN
                                : "var(--c-text2)",
                            border: "1px solid var(--c-borderHover)",
                            borderRadius: 4,
                            padding: "1px 5px",
                          }}
                        >
                          {locked ? "Locked" : m.tag}
                        </span>
                      </span>
                      <span style={{ color: "#6cae8e", fontSize: 12 }}>
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
      </header>

      {state.slopHard ? (
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
              color: "var(--c-text3)",
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
              color: "var(--c-text)",
            }}
          >
            &ldquo;{state.slopRejectReason ?? REJECTS[state.rejectIdx]}&rdquo;
          </h2>
          <p
            style={{
              margin: "0 0 30px",
              color: "var(--c-text3)",
              fontSize: 14.5,
              maxWidth: 430,
              lineHeight: 1.55,
            }}
          >
            Genora won&rsquo;t repurpose what isn&rsquo;t there yet. Add a
            stance, a detail, or an example — then we&rsquo;ll happily reshape
            it for every platform.
          </p>
          <button
            onClick={actions.backToCompose}
            style={{
              background: "var(--c-primaryBg)",
              color: "var(--c-primaryText)",
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
              color: "var(--c-text5)",
              letterSpacing: ".04em",
            }}
          >
            {state.blockedCount} attempts blocked · you&rsquo;re welcome
          </div>
        </div>
      ) : (
        <>
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
                maxWidth: 720,
                padding: "52px 40px 40px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {loading.postDetail ? (
                <Skeleton width="55%" height={36} radius={7} />
              ) : (
                <input
                  value={state.composeTitle}
                  onChange={(e) => actions.onTitle(e.target.value)}
                  placeholder="Title"
                  style={{
                    background: "none",
                    border: "none",
                    fontFamily: "var(--font-newsreader), serif",
                    fontSize: 36,
                    fontWeight: 500,
                    letterSpacing: "-.02em",
                    padding: 0,
                    color: "var(--c-text)",
                  }}
                />
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  margin: "16px 0 24px",
                  paddingBottom: 20,
                  borderBottom: "1px solid var(--c-border)",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    color: "var(--c-text4)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 19h16M4 15h10M4 11h16M4 7h10" />
                  </svg>
                  {derived.words} {derived.words === 1 ? "word" : "words"}
                </span>
                <span
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: "50%",
                    background: "var(--c-borderHover)",
                    flex: "none",
                  }}
                />
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    color: "var(--c-text4)",
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                  {derived.readMin} min read
                </span>
                <div style={{ flex: 1 }} />
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 500,
                    color: substanceColor,
                  }}
                >
                  {substanceLabel}
                </span>
                <div
                  style={{
                    width: 96,
                    height: 5,
                    borderRadius: 3,
                    background: "var(--c-borderStrong)",
                    overflow: "hidden",
                    flex: "none",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${derived.substancePct}%`,
                      background: substanceColor,
                      borderRadius: 3,
                      transition: "width .3s ease",
                    }}
                  />
                </div>
              </div>
              {loading.postDetail ? (
                <div style={{ paddingTop: 8 }}>
                  <SkeletonText
                    lines={5}
                    gap={14}
                    lineHeight={16}
                    lastLineWidth="45%"
                  />
                </div>
              ) : (
                <textarea
                  value={state.draft}
                  onChange={(e) => actions.onDraft(e.target.value)}
                  placeholder="Write the raw thought. One real idea, an opinion, a detail — Genora handles the rest."
                  style={{
                    background: "none",
                    border: "none",
                    resize: "none",
                    fontFamily: "var(--font-newsreader), serif",
                    fontSize: 19,
                    lineHeight: 1.7,
                    color: "var(--c-text2)",
                    minHeight: 320,
                    flex: 1,
                  }}
                />
              )}
            </div>
          </div>

          {state.softNudge && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "0 40px 6px",
                animation: "ffade .2s ease",
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 720,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: "#191510",
                  border: "1px solid #3a2f18",
                  borderRadius: 10,
                  padding: "12px 16px",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#d4a960",
                    flex: "none",
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: 13.5,
                    color: "#d8c69a",
                    lineHeight: 1.4,
                  }}
                >
                  This has a pulse, but it&rsquo;s thin — one concrete detail or
                  a real opinion would give the AI something to work with.
                </span>
                <Hoverable
                  as="button"
                  onClick={actions.addDetail}
                  style={{
                    background: "none",
                    border: "1px solid #3a2f18",
                    borderRadius: 7,
                    color: "#d8c69a",
                    fontSize: 12.5,
                    padding: "6px 12px",
                  }}
                  hoverStyle={{ background: "#221a10" }}
                >
                  Add a detail
                </Hoverable>
                <Hoverable
                  as="button"
                  onClick={actions.generateAnyway}
                  disabled={state.generating}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    background: "none",
                    border: "none",
                    color: "var(--c-text3)",
                    fontSize: 12.5,
                    padding: "6px 8px",
                    ...(state.generating && { cursor: "not-allowed" }),
                  }}
                  hoverStyle={{ color: "var(--c-text)" }}
                >
                  {state.generating && <ButtonSpinner size={11} />}
                  Generate anyway
                </Hoverable>
              </div>
            </div>
          )}

          {derived.quotaLow && !state.softNudge && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "0 40px 6px",
                animation: "ffade .2s ease",
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 720,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-borderStrong)",
                  borderRadius: 10,
                  padding: "12px 16px",
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontSize: 13.5,
                    color: "var(--c-text2)",
                    lineHeight: 1.4,
                  }}
                >
                  One free generation left this month. Add your own API key to
                  keep going, unlimited.
                </span>
                <button
                  onClick={() => actions.goSettings("keys")}
                  style={{
                    background: "var(--c-primaryBg)",
                    color: "var(--c-primaryText)",
                    border: "none",
                    borderRadius: 7,
                    fontSize: 12.5,
                    fontWeight: 600,
                    padding: "7px 13px",
                  }}
                >
                  Add a key
                </button>
              </div>
            </div>
          )}

          <footer
            style={{
              borderTop: "1px solid var(--c-border)",
              padding: "14px 24px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: "var(--c-shell)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  color: "var(--c-text5)",
                  marginRight: 2,
                }}
              >
                Publish to
              </span>
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
              <Hoverable
                as="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 13px",
                  borderRadius: 999,
                  border: "1px dashed var(--c-borderHover)",
                  background: "none",
                  color: "var(--c-text5)",
                  fontSize: 13,
                }}
                hoverStyle={{
                  color: "var(--c-text2)",
                  borderColor: "var(--c-borderHover)",
                }}
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>Custom
              </Hoverable>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                paddingTop: 12,
                borderTop: "1px solid var(--c-border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: "var(--c-text5)",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                  }}
                >
                  ~{derived.tokenEst} tokens
                </span>
                <span style={{ color: "var(--c-borderHover)" }}>·</span>
                <span>
                  {derived.hasKey
                    ? "~$0.01 est."
                    : `Free · ${state.freeLeft} left`}
                </span>
              </div>
              <div style={{ flex: 1 }} />
              <button
                onClick={actions.generate}
                disabled={!derived.canGen || state.generating}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  ...(derived.canGen
                    ? { background: PRIMARY, color: "var(--c-primaryText)" }
                    : {
                        background: "var(--c-popover)",
                        color: "var(--c-text5)",
                        cursor: "not-allowed",
                      }),
                  ...(state.generating && { cursor: "not-allowed" }),
                }}
              >
                {state.generating ? (
                  <>
                    <ButtonSpinner color="var(--c-primaryText)" />
                    Generating…
                  </>
                ) : (
                  <>
                    Check &amp; generate
                    <span style={{ fontSize: 14 }}>→</span>
                  </>
                )}
              </button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
