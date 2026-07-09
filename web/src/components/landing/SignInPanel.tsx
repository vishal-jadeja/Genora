"use client";

import { Magnetic } from "./Magnetic";
import { GoogleIcon } from "./GoogleIcon";
import { CARD, GROTESK, INK, MONO, MUTED, MUTED2, ORANGE, RED, TEXT } from "./constants";
import styles from "@/app/signin/signin.module.css";

export function SignInPanel({
  action,
  error,
}: {
  action: () => Promise<void>;
  error: string | null;
}) {
  return (
    <div
      className={`${styles.card} ${styles.rise}`}
      style={{
        position: "relative",
        zIndex: 5,
        width: "min(420px, 88vw)",
        background: CARD,
        border: "1px solid rgba(242,238,231,.14)",
        borderRadius: 8,
        boxShadow: "0 30px 80px -30px rgba(0,0,0,.8)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 18,
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
          auth.session
        </span>
      </div>

      <p
        style={{
          margin: "0 0 22px",
          fontSize: 14.5,
          lineHeight: 1.6,
          color: MUTED2,
          fontFamily: GROTESK,
        }}
      >
        Sign in with your Google account — no password, no setup.
      </p>

      <form action={action}>
        <Magnetic
          as="button"
          type="submit"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            border: "1px solid rgba(14,13,11,.1)",
            cursor: "pointer",
            background: TEXT,
            color: INK,
            fontFamily: MONO,
            fontSize: 12,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            fontWeight: 500,
            padding: "15px 20px",
            borderRadius: 3,
          }}
        >
          <GoogleIcon size={18} />
          Continue with Google
        </Magnetic>
      </form>

      {error && (
        <div
          style={{
            marginTop: 14,
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: ".04em",
            color: RED,
          }}
        >
          ⚠ {error}
        </div>
      )}

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
  );
}
