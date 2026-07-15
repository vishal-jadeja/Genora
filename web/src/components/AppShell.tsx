"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { useGenora } from "./GenoraProvider";
import { Sidebar } from "./Sidebar";

const PEEK_HIDE_DELAY = 150;

export function AppShell({
  children,
  modal,
  user,
}: {
  children: ReactNode;
  modal: ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}) {
  const { state, derived, actions } = useGenora();
  const collapsed = state.sidebarCollapsed;
  const [peek, setPeek] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showPeek = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setPeek(true);
  };
  const scheduleHidePeek = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setPeek(false), PEEK_HIDE_DELAY);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        actions.toggleSidebarCollapsed();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [actions]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <AppHeader
        state={state}
        derived={derived}
        actions={actions}
        user={user}
        onToggleMouseEnter={showPeek}
        onToggleMouseLeave={scheduleHidePeek}
      />

      <div
        style={{ position: "relative", display: "flex", flex: 1, minHeight: 0 }}
      >
        {!collapsed && (
          <Sidebar state={state} derived={derived} actions={actions} />
        )}

        {collapsed && (
          <div
            onMouseEnter={showPeek}
            onMouseLeave={scheduleHidePeek}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: peek ? 270 : 14,
              zIndex: 30,
              transition: peek ? "none" : "width 120ms ease",
            }}
          >
            {peek && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  maxHeight: "100%",
                  overflowY: "auto",
                  overflowX: "hidden",
                  borderRadius: "0 12px 12px 0",
                  boxShadow: "4px 0 24px rgba(0,0,0,.35)",
                  animation: "fslidein 160ms ease",
                }}
              >
                <Sidebar state={state} derived={derived} actions={actions} />
              </div>
            )}
          </div>
        )}

        <div
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            height: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </div>
        {modal}

        {!!state.flashMsg && (
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--c-surfaceHover)",
              border: "1px solid var(--c-borderHover)",
              borderRadius: 9,
              padding: "10px 16px",
              fontSize: 13,
              color: "var(--c-text)",
              display: "flex",
              alignItems: "center",
              gap: 9,
              boxShadow: "0 10px 28px rgba(0,0,0,.6)",
              animation: "ffade .2s ease",
              whiteSpace: "nowrap",
              zIndex: 50,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                flex: "none",
                background: state.flashKind === "error" ? "#d47a7a" : "#6cae8e",
              }}
            />
            {state.flashMsg}
          </div>
        )}
      </div>
    </div>
  );
}
