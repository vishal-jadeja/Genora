"use client";

import Link from "next/link";
import { Hoverable } from "@/components/Hoverable";
import { SignInPanel } from "./SignInPanel";
import { ANTON, GROTESK, INK, MONO, ORANGE, TEXT, linkStyle } from "./constants";
import styles from "@/app/signin/signin.module.css";

export function SignInPage({
  action,
  error,
}: {
  action: () => Promise<void>;
  error: string | null;
}) {
  return (
    <div
      style={{
        position: "relative",
        minHeight: "100dvh",
        background: INK,
        color: TEXT,
        fontFamily: GROTESK,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(242,238,231,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(242,238,231,.045) 1px,transparent 1px)",
          backgroundSize: "88px 88px",
          opacity: 0.7,
        }}
      />

      <Link
        href="/"
        className={styles.logo}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          gap: 11,
          textDecoration: "none",
        }}
      >
        <span
          style={{
            position: "relative",
            width: 16,
            height: 16,
            display: "inline-block",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              bottom: 0,
              width: 1,
              background: ORANGE,
              transform: "translateX(-50%)",
            }}
          />
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: 1,
              background: ORANGE,
              transform: "translateY(-50%)",
            }}
          />
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: ORANGE,
              transform: "translate(-50%,-50%)",
            }}
          />
        </span>
        <span
          style={{
            fontFamily: ANTON,
            fontSize: 22,
            letterSpacing: ".04em",
            color: TEXT,
            lineHeight: 1,
          }}
        >
          GENORA
        </span>
      </Link>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100dvh",
          padding: 24,
        }}
      >
        <div style={{ width: "min(420px, 88vw)" }}>
          <div
            className={styles.rise}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <span style={{ width: 22, height: 1, background: ORANGE }} />
            <span
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: ".28em",
                textTransform: "uppercase",
                color: ORANGE,
              }}
            >
              Sign in to continue
            </span>
            <span style={{ width: 22, height: 1, background: ORANGE }} />
          </div>

          <h1
            className={styles.rise}
            style={{
              margin: "0 0 28px",
              textAlign: "center",
              fontFamily: ANTON,
              fontWeight: 400,
              fontSize: "clamp(32px,6vw,52px)",
              lineHeight: 0.95,
            }}
          >
            Welcome back.
          </h1>

          <SignInPanel action={action} error={error} />

          <div
            style={{
              marginTop: 20,
              textAlign: "center",
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: ".1em",
              color: "#5f594f",
            }}
          >
            By continuing you agree to the{" "}
            <a href="#" style={{ color: "#5f594f" }}>
              Terms
            </a>{" "}
            &amp;{" "}
            <a href="#" style={{ color: "#5f594f" }}>
              Privacy Policy
            </a>
            .
          </div>

          <div style={{ marginTop: 28, textAlign: "center" }}>
            <Hoverable
              as={Link}
              href="/"
              style={linkStyle}
              hoverStyle={{ color: TEXT }}
            >
              ← Back to home
            </Hoverable>
          </div>
        </div>
      </div>
    </div>
  );
}
