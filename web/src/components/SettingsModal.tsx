"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Hoverable } from "./Hoverable";
import { SettingsBody, ThemeToggle } from "./SettingsBody";
import { modalCardStyle } from "./styleHelpers";
import type { GenoraViewProps } from "./viewProps";

export function SettingsModal({ state, derived, actions }: GenoraViewProps) {
  const router = useRouter();
  const close = () => {
    // A direct or refreshed visit to /settings has no prior entry in this
    // tab's history to go back to — fall back to Dashboard instead of a
    // no-op (or leaving the tab) on close.
    if (window.history.length <= 1) {
      router.push("/dashboard");
    } else {
      router.back();
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div
        onClick={close}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "rgba(0,0,0,.5)",
          animation: "ffade .15s ease",
        }}
      />
      <div style={modalCardStyle}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "15px 20px",
            borderBottom: "1px solid var(--c-border)",
            flex: "none",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-newsreader), serif",
              fontSize: 16,
            }}
          >
            Settings
          </span>
          <div style={{ flex: 1 }} />
          <ThemeToggle state={state} actions={actions} />
          <Hoverable
            as="button"
            onClick={close}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              background: "none",
              border: "none",
              borderRadius: 6,
              color: "var(--c-text3)",
            }}
            hoverStyle={{
              background: "var(--c-surfaceHover)",
              color: "var(--c-text)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </Hoverable>
        </header>
        <SettingsBody state={state} derived={derived} actions={actions} />
      </div>
    </>
  );
}
