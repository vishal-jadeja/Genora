"use client";

import { Hoverable } from "@/components/Hoverable";
import { Magnetic } from "./Magnetic";
import { ANTON, INK, MONO, ORANGE, TEXT, linkStyle } from "./constants";
import styles from "./LandingPage.module.css";

export function Nav() {
  return (
    <nav
      className={styles.nav}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backdropFilter: "blur(8px)",
        background:
          "linear-gradient(180deg,rgba(14,13,11,.85),rgba(14,13,11,0))",
      }}
    >
      <a
        href="#top"
        style={{
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
      </a>
      <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
        <Hoverable
          as="a"
          href="#intro"
          className={styles.navLink}
          style={linkStyle}
          hoverStyle={{ color: TEXT }}
        >
          Intro
        </Hoverable>
        <Hoverable
          as="a"
          href="#features"
          className={styles.navLink}
          style={linkStyle}
          hoverStyle={{ color: TEXT }}
        >
          Features
        </Hoverable>
        <Hoverable
          as="a"
          href="#platforms"
          className={styles.navLink}
          style={linkStyle}
          hoverStyle={{ color: TEXT }}
        >
          Platforms
        </Hoverable>
        <Hoverable
          as="a"
          href="#pricing"
          className={styles.navLink}
          style={linkStyle}
          hoverStyle={{ color: TEXT }}
        >
          Pricing
        </Hoverable>
        <Magnetic
          as="a"
          href="#cta"
          style={{
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: ".16em",
            textTransform: "uppercase",
            color: INK,
            background: ORANGE,
            padding: "9px 16px",
            borderRadius: 2,
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Get access
        </Magnetic>
      </div>
    </nav>
  );
}
