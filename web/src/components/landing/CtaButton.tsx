"use client";

import { Magnetic } from "./Magnetic";
import { CARD, INK, MONO, ORANGE } from "./constants";

export function CtaButton() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        background: CARD,
        border: "1px solid rgba(242,238,231,.14)",
        borderRadius: 4,
        padding: 8,
      }}
    >
      <Magnetic
        as="a"
        href="/api/auth/signin"
        style={{
          display: "block",
          width: "100%",
          textAlign: "center",
          textDecoration: "none",
          border: "none",
          cursor: "pointer",
          background: ORANGE,
          color: INK,
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          fontWeight: 500,
          padding: "16px 22px",
          borderRadius: 3,
        }}
      >
        Get started
      </Magnetic>
    </div>
  );
}
