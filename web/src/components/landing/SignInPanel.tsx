"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { ButtonSpinner } from "../ButtonSpinner";
import { Magnetic } from "./Magnetic";
import { GoogleIcon } from "./GoogleIcon";
import { GitHubIcon } from "./GitHubIcon";
import {
  CARD,
  GROTESK,
  INK,
  MONO,
  MUTED,
  MUTED2,
  ORANGE,
  RED,
  TEXT,
} from "./constants";
import styles from "@/app/signin/signin.module.css";

type Provider = {
  id: string;
  label: string;
  action: () => Promise<void>;
  icon: ReactNode;
  background: string;
  color: string;
  border: string;
};

function SignInButton({
  label,
  icon,
  background,
  color,
  border,
}: {
  label: string;
  icon: ReactNode;
  background: string;
  color: string;
  border: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Magnetic
      as="button"
      type="submit"
      disabled={pending}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        width: "100%",
        border,
        cursor: pending ? "not-allowed" : "pointer",
        background,
        color,
        fontFamily: MONO,
        fontSize: 12,
        letterSpacing: ".12em",
        textTransform: "uppercase",
        fontWeight: 500,
        padding: "15px 20px",
        borderRadius: 3,
        opacity: pending ? 0.7 : 1,
      }}
    >
      {pending ? <ButtonSpinner size={14} color={color} /> : icon}
      {pending ? "Redirecting…" : label}
    </Magnetic>
  );
}

export function SignInPanel({
  actions,
  error,
}: {
  actions: {
    google: () => Promise<void>;
    github: () => Promise<void>;
  };
  error: string | null;
}) {
  const providers: Provider[] = [
    {
      id: "google",
      label: "Continue with Google",
      action: actions.google,
      icon: <GoogleIcon size={18} />,
      background: TEXT,
      color: INK,
      border: "1px solid rgba(14,13,11,.1)",
    },
    {
      id: "github",
      label: "Continue with GitHub",
      action: actions.github,
      icon: <GitHubIcon size={18} />,
      background: "#000",
      color: TEXT,
      border: "1px solid #2b2b2b",
    },
  ];

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
        Sign in to continue — no password, no setup.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {providers.map((p) => (
          <form key={p.id} action={p.action}>
            <SignInButton
              label={p.label}
              icon={p.icon}
              background={p.background}
              color={p.color}
              border={p.border}
            />
          </form>
        ))}
      </div>

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
