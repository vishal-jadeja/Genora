"use client";

import {
  ANTON,
  CARD,
  MONO,
  MUTED,
  MUTED2,
  ORANGE,
  RED,
  TEAL,
} from "./constants";
import styles from "./LandingPage.module.css";

export function HowItWorksSection() {
  return (
    <section
      id="how"
      data-screen-label="How it works"
      style={{
        position: "relative",
        zIndex: 1,
        padding: "110px 40px 40px",
        maxWidth: 1180,
        margin: "0 auto",
      }}
    >
      <div
        data-reveal=""
        style={{
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: ".28em",
          textTransform: "uppercase",
          color: ORANGE,
          marginBottom: 16,
        }}
      >
        04 — How it works
      </div>
      <h2
        data-reveal=""
        style={{
          margin: "0 0 60px",
          fontFamily: ANTON,
          fontWeight: 400,
          fontSize: "clamp(34px,5vw,68px)",
          lineHeight: 1,
          maxWidth: "14ch",
        }}
      >
        From messy note to shipped, in one lane.
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div
          data-reveal=""
          className={styles.howRow}
          style={{ borderTop: "1px solid rgba(242,238,231,.1)" }}
        >
          <span
            style={{
              fontFamily: ANTON,
              fontSize: 52,
              color: ORANGE,
              lineHeight: 1,
            }}
          >
            01
          </span>
          <div>
            <h3 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 600 }}>
              Write the raw thought
            </h3>
            <p
              style={{
                margin: 0,
                color: MUTED,
                fontSize: 15,
                lineHeight: 1.55,
                maxWidth: "44ch",
              }}
            >
              Lowercase, half-formed, one sentence — however it falls out of
              your head. That&apos;s the whole job.
            </p>
          </div>
          <div
            style={{
              position: "relative",
              background: CARD,
              border: "1px solid rgba(242,238,231,.12)",
              borderRadius: 6,
              padding: 16,
              fontFamily: MONO,
              fontSize: 12,
              color: MUTED2,
            }}
          >
            shipped a feature nobody asked for…
            <span
              style={{
                display: "inline-block",
                width: 7,
                height: 14,
                background: ORANGE,
                marginLeft: 2,
                verticalAlign: "middle",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: -6,
                top: -6,
                width: 12,
                height: 12,
                borderLeft: `1.5px solid ${ORANGE}`,
                borderTop: `1.5px solid ${ORANGE}`,
              }}
            />
          </div>
        </div>

        <div
          data-reveal=""
          className={styles.howRow}
          style={{ borderTop: "1px solid rgba(242,238,231,.1)" }}
        >
          <span
            style={{
              fontFamily: ANTON,
              fontSize: 52,
              color: ORANGE,
              lineHeight: 1,
            }}
          >
            02
          </span>
          <div>
            <h3 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 600 }}>
              Slop Guard gate
            </h3>
            <p
              style={{
                margin: 0,
                color: MUTED,
                fontSize: 15,
                lineHeight: 1.55,
                maxWidth: "44ch",
              }}
            >
              Before anything fans out, the guard checks for clichés, filler and
              hollow hype. Nothing generic gets through.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: RED,
                fontFamily: MONO,
              }}
            >
              <span>⚠</span> &quot;leverage synergies&quot; — cut
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: RED,
                fontFamily: MONO,
              }}
            >
              <span>⚠</span> &quot;in today&apos;s landscape&quot; — cut
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: TEAL,
                fontFamily: MONO,
              }}
            >
              <span>✓</span> voice preserved — pass
            </div>
          </div>
        </div>

        <div
          data-reveal=""
          className={styles.howRow}
          style={{ borderTop: "1px solid rgba(242,238,231,.1)" }}
        >
          <span
            style={{
              fontFamily: ANTON,
              fontSize: 52,
              color: ORANGE,
              lineHeight: 1,
            }}
          >
            03
          </span>
          <div>
            <h3 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 600 }}>
              Fan-out generation
            </h3>
            <p
              style={{
                margin: 0,
                color: MUTED,
                fontSize: 15,
                lineHeight: 1.55,
                maxWidth: "44ch",
              }}
            >
              Writer drafts, Critic pushes back, Reviser lands it — in parallel,
              once per platform you picked.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                padding: "6px 9px",
                border: "1px solid #0A66C2",
                color: "#4a9fe0",
                borderRadius: 3,
              }}
            >
              LinkedIn
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                padding: "6px 9px",
                border: "1px solid #71767b",
                color: "#c9ced2",
                borderRadius: 3,
              }}
            >
              X
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                padding: "6px 9px",
                border: "1px solid #FF4500",
                color: "#ff7a45",
                borderRadius: 3,
              }}
            >
              Reddit
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                padding: "6px 9px",
                border: "1px solid #888",
                color: "#cfcac0",
                borderRadius: 3,
              }}
            >
              Medium
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                padding: "6px 9px",
                border: "1px solid #FF6719",
                color: "#ff8f4d",
                borderRadius: 3,
              }}
            >
              Substack
            </span>
          </div>
        </div>

        <div
          data-reveal=""
          className={styles.howRow}
          style={{
            borderTop: "1px solid rgba(242,238,231,.1)",
            borderBottom: "1px solid rgba(242,238,231,.1)",
          }}
        >
          <span
            style={{
              fontFamily: ANTON,
              fontSize: 52,
              color: ORANGE,
              lineHeight: 1,
            }}
          >
            04
          </span>
          <div>
            <h3 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 600 }}>
              Review &amp; publish
            </h3>
            <p
              style={{
                margin: 0,
                color: MUTED,
                fontSize: 15,
                lineHeight: 1.55,
                maxWidth: "44ch",
              }}
            >
              Approve, nudge a line, or schedule. If one platform&apos;s post
              fails, the rest still ship — retry only what broke.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 12,
                fontFamily: MONO,
                color: TEAL,
              }}
            >
              <span>LinkedIn</span>
              <span>✓ published</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 12,
                fontFamily: MONO,
                color: TEAL,
              }}
            >
              <span>X · Medium · Substack</span>
              <span>✓ scheduled</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 12,
                fontFamily: MONO,
                color: ORANGE,
              }}
            >
              <span>Reddit</span>
              <span>↻ retry</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
