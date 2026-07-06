"use client";

import { useState } from "react";
import { Magnetic } from "./Magnetic";
import { CARD, GROTESK, INK, MONO, ORANGE, TEAL, TEXT } from "./constants";
import styles from "./LandingPage.module.css";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          background: "#12160F",
          border: "1px solid rgba(42,157,143,.4)",
          borderRadius: 4,
          padding: 20,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: TEAL,
            boxShadow: `0 0 10px ${TEAL}`,
          }}
        />
        <span style={{ fontSize: 15, color: TEXT }}>
          You&apos;re on the list — we&apos;ll email{" "}
          <span style={{ color: ORANGE }}>{email}</span> when your seat opens.
        </span>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (email.trim()) setSubmitted(true);
      }}
      className={styles.ctaForm}
      style={{
        background: CARD,
        border: "1px solid rgba(242,238,231,.14)",
        borderRadius: 4,
        padding: "8px 8px 8px 18px",
      }}
    >
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        placeholder="you@company.com"
        aria-label="Email address"
        required
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          color: TEXT,
          fontFamily: GROTESK,
          fontSize: 15,
        }}
      />
      <Magnetic
        as="button"
        type="submit"
        style={{
          border: "none",
          cursor: "pointer",
          background: ORANGE,
          color: INK,
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          fontWeight: 500,
          padding: "12px 22px",
          borderRadius: 3,
        }}
      >
        Join waitlist
      </Magnetic>
    </form>
  );
}
