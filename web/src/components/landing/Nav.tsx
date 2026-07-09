"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Hoverable } from "@/components/Hoverable";
import { Magnetic } from "./Magnetic";
import { ANTON, INK, MONO, ORANGE, TEXT, linkStyle } from "./constants";
import styles from "./LandingPage.module.css";

const NAV_LINKS = [
  { href: "#intro", label: "Intro" },
  { href: "#features", label: "Features" },
  { href: "#platforms", label: "Platforms" },
  { href: "#pricing", label: "Pricing" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <nav
      ref={navRef as React.RefObject<HTMLElement>}
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
            width: 22,
            height: 22,
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
        {NAV_LINKS.map((link) => (
          <Hoverable
            key={link.href}
            as="a"
            href={link.href}
            className={styles.navLink}
            style={linkStyle}
            hoverStyle={{ color: TEXT }}
          >
            {link.label}
          </Hoverable>
        ))}
        <Magnetic
          as={Link}
          href="/signin"
          className={styles.navCta}
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
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={styles.navToggle}
          style={{
            background: "none",
            border: "none",
            padding: 6,
            display: "none",
            flexDirection: "column",
            gap: 5,
            cursor: "pointer",
          }}
        >
          <span
            style={{
              width: 20,
              height: 1.5,
              background: TEXT,
              transition: "transform .2s ease",
              transform: open ? "translateY(6.5px) rotate(45deg)" : "none",
            }}
          />
          <span
            style={{
              width: 20,
              height: 1.5,
              background: TEXT,
              opacity: open ? 0 : 1,
              transition: "opacity .2s ease",
            }}
          />
          <span
            style={{
              width: 20,
              height: 1.5,
              background: TEXT,
              transition: "transform .2s ease",
              transform: open ? "translateY(-6.5px) rotate(-45deg)" : "none",
            }}
          />
        </button>
      </div>

      {open && (
        <div
          className={styles.navMobilePanel}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: INK,
            borderBottom: "1px solid rgba(242,238,231,.14)",
            display: "flex",
            flexDirection: "column",
            padding: "8px 20px 20px",
          }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              style={{
                ...linkStyle,
                padding: "14px 0",
                borderBottom: "1px solid rgba(242,238,231,.08)",
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
