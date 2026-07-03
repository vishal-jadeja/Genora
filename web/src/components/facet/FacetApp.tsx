"use client";

import { DEFAULT_THEME } from "@/lib/facet/data";
import { useFacetController } from "@/lib/facet/useFacetController";
import { DashboardView } from "./DashboardView";
import { ComposeView } from "./ComposeView";
import { OutputView } from "./OutputView";
import { SettingsView } from "./SettingsView";

const t = DEFAULT_THEME.t;

const themeVars = {
  "--c-shell": t.shell,
  "--c-canvas": t.canvas,
  "--c-surface": t.surface,
  "--c-surfaceHover": t.surfaceHover,
  "--c-popover": t.popover,
  "--c-tile": t.tile,
  "--c-border": t.border,
  "--c-borderStrong": t.borderStrong,
  "--c-borderHover": t.borderHover,
} as React.CSSProperties;

export function FacetApp() {
  const { state, derived, actions } = useFacetController();

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        overflow: "hidden",
        position: "relative",
        background: "var(--c-shell)",
        ...themeVars,
      }}
    >
      {state.view === "dashboard" && (
        <DashboardView state={state} derived={derived} actions={actions} />
      )}
      {state.view === "compose" && (
        <ComposeView state={state} derived={derived} actions={actions} />
      )}
      {state.view === "output" && (
        <OutputView state={state} derived={derived} actions={actions} />
      )}
      {state.view === "settings" && (
        <SettingsView state={state} derived={derived} actions={actions} />
      )}
    </div>
  );
}
