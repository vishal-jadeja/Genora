"use client";

import { Hoverable } from "./Hoverable";
import { moveOptStyle, popoverStyle } from "./styleHelpers";
import type { FacetViewProps } from "./viewProps";

export function AppHeader({
  state,
  actions,
  onToggleMouseEnter,
  onToggleMouseLeave,
}: FacetViewProps & {
  onToggleMouseEnter: () => void;
  onToggleMouseLeave: () => void;
}) {
  const collapsed = state.sidebarCollapsed;

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: 52,
        flex: "none",
        padding: "0 14px",
        borderBottom: "1px solid var(--c-border)",
        background: "var(--c-shell)",
      }}
    >
      <Hoverable
        as="button"
        title={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
        onClick={actions.toggleSidebarCollapsed}
        onMouseEnter={collapsed ? onToggleMouseEnter : undefined}
        onMouseLeave={collapsed ? onToggleMouseLeave : undefined}
        style={{
          width: 32,
          height: 32,
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "none",
          borderRadius: 8,
          color: "var(--c-text3)",
        }}
        hoverStyle={{
          background: "var(--c-popover)",
          color: "var(--c-text)",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="16" rx="2.5" />
          <path d="M9.5 4v16" />
        </svg>
      </Hoverable>

      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt="Genora"
          width={26}
          height={26}
          style={{ borderRadius: 7, flex: "none" }}
        />
        <span style={{ fontSize: 14, fontWeight: 600 }}>Genora</span>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ position: "relative" }}>
        {state.isAuthed ? (
          <>
            <Hoverable
              as="button"
              title="Account"
              onClick={actions.toggleProfileMenu}
              style={{
                width: 32,
                height: 32,
                flex: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                border: "1px solid var(--c-borderStrong)",
                background: "var(--c-surface)",
                color: "var(--c-text2)",
                fontSize: 12.5,
                fontWeight: 600,
              }}
              hoverStyle={{ borderColor: "var(--c-borderHover)" }}
            >
              V
            </Hoverable>
            {state.profileMenuOpen && (
              <div style={{ ...popoverStyle, top: 40, right: 0, left: "auto" }}>
                <button
                  onClick={() => {
                    actions.toggleProfileMenu();
                    actions.goSettings();
                  }}
                  style={moveOptStyle}
                >
                  Settings
                </button>
                <button onClick={actions.logOut} style={moveOptStyle}>
                  Log out
                </button>
              </div>
            )}
          </>
        ) : (
          <Hoverable
            as="button"
            onClick={actions.logIn}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--c-primaryBg)",
              border: "none",
              borderRadius: 8,
              padding: "7px 14px",
              color: "var(--c-primaryText)",
              fontSize: 13,
              fontWeight: 600,
            }}
            hoverStyle={{ opacity: 0.9 }}
          >
            Log in
          </Hoverable>
        )}
      </div>
    </header>
  );
}
