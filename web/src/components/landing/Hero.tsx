"use client";

import type { CSSProperties } from "react";
import {
  ANTON,
  CARD,
  GROTESK,
  MONO,
  MUTED,
  MUTED2,
  ORANGE,
  TEXT,
} from "./constants";
import styles from "./LandingPage.module.css";

const FLY_CARDS: {
  style: CSSProperties;
  iconBg: string;
  label: string;
  labelColor: string;
  barBg: string;
  iconRadius?: string;
  bar1: { h: number; w: string };
  bar2: { w: string };
}[] = [
  {
    style: { background: "#fff" },
    iconBg: "#0A66C2",
    iconRadius: "3px",
    label: "LinkedIn",
    labelColor: "#0A66C2",
    barBg: "#e6e6e6",
    bar1: { h: 5, w: "90%" },
    bar2: { w: "70%" },
  },
  {
    style: { background: "#000", border: "1px solid #2b2b2b" },
    iconBg: "#111",
    iconRadius: "3px",
    label: "Thread",
    labelColor: MUTED,
    barBg: "#2b2b2b",
    bar1: { h: 5, w: "85%" },
    bar2: { w: "60%" },
  },
  {
    style: { background: "#fff" },
    iconBg: "#FF4500",
    iconRadius: "50%",
    label: "r/SaaS",
    labelColor: "#FF4500",
    barBg: "#e6e6e6",
    bar1: { h: 5, w: "80%" },
    bar2: { w: "65%" },
  },
  {
    style: { background: "#fff" },
    iconBg: "#111",
    iconRadius: "50%",
    label: "Medium",
    labelColor: "#111",
    barBg: "#eaeaea",
    bar1: { h: 6, w: "85%" },
    bar2: { w: "55%" },
  },
  {
    style: { background: "#FFF6E9" },
    iconBg: "#FF6719",
    iconRadius: "3px",
    label: "Substack",
    labelColor: "#FF6719",
    barBg: "#efe4d2",
    bar1: { h: 5, w: "88%" },
    bar2: { w: "62%" },
  },
];

export function Hero() {
  return (
    <section
      id="top"
      data-screen-label="Hero"
      style={{ position: "relative", zIndex: 1 }}
    >
      <div id="heroSection" style={{ position: "relative" }}>
        <div
          id="heroPin"
          className={styles.heroPin}
          style={{
            position: "relative",
            height: "100vh",
            minHeight: 760,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div className={styles.heroNavSpacer} aria-hidden="true" />
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              overflow: "hidden",
            }}
          >
            <div
              data-hero-el=""
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 26,
              }}
            >
              <span style={{ width: 26, height: 1, background: ORANGE }} />
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  letterSpacing: ".28em",
                  textTransform: "uppercase",
                  color: ORANGE,
                }}
              >
                Writing-first content engine
              </span>
              <span style={{ width: 26, height: 1, background: ORANGE }} />
            </div>

            <h1
              style={{
                margin: 0,
                textAlign: "center",
                fontFamily: ANTON,
                fontWeight: 400,
                fontSize: "clamp(46px,8.4vw,132px)",
                lineHeight: 0.92,
                letterSpacing: ".005em",
                textTransform: "none",
              }}
            >
              <span className="hero-word" style={{ display: "inline-block" }}>
                Write
              </span>{" "}
              <span className="hero-word" style={{ display: "inline-block" }}>
                once.
              </span>
              <br />
              <span className="hero-word" style={{ display: "inline-block" }}>
                Say
              </span>{" "}
              <span className="hero-word" style={{ display: "inline-block" }}>
                it
              </span>{" "}
              <span
                className="hero-word"
                style={{ display: "inline-block", position: "relative" }}
              >
                everywhere
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: ".06em",
                    height: 6,
                    background: ORANGE,
                  }}
                />
              </span>
              <span
                className="hero-word"
                style={{ display: "inline-block", color: ORANGE }}
              >
                .
              </span>
            </h1>

            <p
              data-hero-el=""
              style={{
                maxWidth: 640,
                textAlign: "center",
                margin: "26px auto 0",
                fontSize: 17,
                lineHeight: 1.55,
                color: MUTED2,
              }}
            >
              One raw thought in — a platform-native post out for{" "}
              <span style={{ color: TEXT }}>LinkedIn</span>,{" "}
              <span style={{ color: TEXT }}>X</span>,{" "}
              <span style={{ color: TEXT }}>Reddit</span>,{" "}
              <span style={{ color: TEXT }}>Medium</span> &{" "}
              <span style={{ color: TEXT }}>Substack</span>. No copy-paste. No
              re-writing five times.
            </p>

            <div
              id="heroStage"
              style={{
                position: "relative",
                marginTop: 52,
                width: "100%",
                maxWidth: 520,
                height: 230,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                id="heroNote"
                className={styles.heroNote}
                style={{
                  position: "relative",
                  zIndex: 5,
                  width: "min(420px, 84vw)",
                  background: CARD,
                  border: "1px solid rgba(242,238,231,.14)",
                  borderRadius: 6,
                  padding: "22px 24px",
                  boxShadow: "0 30px 80px -30px rgba(0,0,0,.8)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: ORANGE,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      letterSpacing: ".2em",
                      textTransform: "uppercase",
                      color: MUTED,
                    }}
                  >
                    raw_thought.txt
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 15.5,
                    lineHeight: 1.6,
                    color: "#D8D2C7",
                    fontFamily: GROTESK,
                  }}
                >
                  shipped a feature <span style={{ color: MUTED }}>nobody</span>{" "}
                  asked for → became our{" "}
                  <span style={{ color: ORANGE }}>most-used</span> one. building
                  for yourself is underrated?
                </p>
                <span
                  style={{
                    position: "absolute",
                    left: -6,
                    top: -6,
                    width: 14,
                    height: 14,
                    borderLeft: `1.5px solid ${ORANGE}`,
                    borderTop: `1.5px solid ${ORANGE}`,
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: -6,
                    top: -6,
                    width: 14,
                    height: 14,
                    borderRight: `1.5px solid ${ORANGE}`,
                    borderTop: `1.5px solid ${ORANGE}`,
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: -6,
                    bottom: -6,
                    width: 14,
                    height: 14,
                    borderLeft: `1.5px solid ${ORANGE}`,
                    borderBottom: `1.5px solid ${ORANGE}`,
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: -6,
                    bottom: -6,
                    width: 14,
                    height: 14,
                    borderRight: `1.5px solid ${ORANGE}`,
                    borderBottom: `1.5px solid ${ORANGE}`,
                  }}
                />
              </div>

              <div
                id="heroAnnotate"
                className={styles.heroAnnotate}
                style={{
                  position: "absolute",
                  zIndex: 6,
                  left: "calc(50% + 230px)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  pointerEvents: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: ORANGE,
                      boxShadow: `0 0 6px ${ORANGE}`,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      letterSpacing: ".1em",
                      color: MUTED,
                    }}
                  >
                    1 input
                  </span>
                </div>
                <div
                  style={{
                    width: 1,
                    height: 34,
                    marginLeft: 2,
                    background:
                      "repeating-linear-gradient(#8A8378 0 3px,transparent 3px 7px)",
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: ORANGE,
                      boxShadow: `0 0 6px ${ORANGE}`,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      letterSpacing: ".1em",
                      color: MUTED,
                    }}
                  >
                    5 outputs
                  </span>
                </div>
              </div>

              {FLY_CARDS.map((f, i) => (
                <div
                  key={f.label}
                  className="hero-fly"
                  data-fly={i}
                  style={{
                    position: "absolute",
                    zIndex: 4,
                    width: 150,
                    borderRadius: 8,
                    padding: 12,
                    opacity: 0,
                    boxShadow: "0 20px 50px -20px rgba(0,0,0,.7)",
                    ...f.style,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 7,
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: f.iconRadius,
                        background: f.iconBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 12,
                        border: i === 1 ? "1px solid #333" : undefined,
                      }}
                    >
                      {i === 1 ? "X" : null}
                    </span>
                    <span
                      style={{
                        fontFamily: i === 3 ? "Georgia, serif" : MONO,
                        fontSize: i === 3 ? 9 : 8,
                        letterSpacing: i === 3 ? undefined : ".12em",
                        color: f.labelColor,
                        textTransform: i === 3 ? undefined : "uppercase",
                      }}
                    >
                      {f.label}
                    </span>
                  </div>
                  <div
                    style={{
                      height: f.bar1.h,
                      width: f.bar1.w,
                      background: f.barBg,
                      borderRadius: 3,
                      marginBottom: 4,
                    }}
                  />
                  <div
                    style={{
                      height: 5,
                      width: f.bar2.w,
                      background: f.barBg,
                      borderRadius: 3,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div
            id="scrollCue"
            style={{
              position: "absolute",
              bottom: 26,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              animation: "cueBob 2.2s ease-in-out infinite",
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: ".22em",
                textTransform: "uppercase",
                color: MUTED,
              }}
            >
              Scroll
            </span>
            <span
              style={{
                width: 1,
                height: 26,
                background: `linear-gradient(${ORANGE},transparent)`,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
