"use client";

import { useState } from "react";
import {
  CARD2,
  GROTESK,
  MONO,
  MUTED,
  ORANGE,
  RED,
  TEAL,
  TEXT,
} from "./constants";

export function SlopGuardDemo() {
  const [hover, setHover] = useState(false);
  return (
    <div
      data-reveal=""
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        marginTop: 56,
        position: "relative",
        background: CARD2,
        border: "1px solid rgba(242,238,231,.12)",
        borderRadius: 8,
        padding: "34px 34px 30px",
        cursor: "crosshair",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: ".2em",
            textTransform: "uppercase",
            color: MUTED,
          }}
        >
          hover to run Slop Guard
        </span>
        {hover ? (
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: TEAL,
            }}
          >
            ✓ shipped
          </span>
        ) : (
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: RED,
            }}
          >
            ⚠ flagged
          </span>
        )}
      </div>
      {!hover ? (
        <p
          style={{
            margin: 0,
            fontSize: 22,
            lineHeight: 1.5,
            color: "#7C7568",
            fontFamily: GROTESK,
          }}
        >
          &quot;In today&apos;s fast-paced digital landscape, it&apos;s more
          important than ever to leverage synergies and unlock your true
          potential. Let&apos;s dive in! 🚀&quot;
        </p>
      ) : (
        <p
          style={{
            margin: 0,
            fontSize: 22,
            lineHeight: 1.5,
            color: TEXT,
            fontFamily: GROTESK,
          }}
        >
          &quot;I built a thing nobody asked for. It&apos;s now the reason
          people pay us. Turns out scratching your own itch scales better than a
          roadmap.&quot;
        </p>
      )}
      <div
        style={{
          position: "absolute",
          right: 20,
          bottom: 16,
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: ORANGE,
          boxShadow: `0 0 10px ${ORANGE}`,
        }}
      />
    </div>
  );
}
