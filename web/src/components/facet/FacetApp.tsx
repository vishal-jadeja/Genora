"use client";

import { useEffect, useState } from "react";
import { DARK_THEME, LIGHT_THEME } from "@/lib/facet/data";
import { useFacetController } from "@/lib/facet/useFacetController";
import { DashboardView } from "./DashboardView";
import { ComposeView } from "./ComposeView";
import { OutputView } from "./OutputView";
import { SettingsView } from "./SettingsView";

function themeVarsFor(t: typeof DARK_THEME.t): React.CSSProperties {
  return {
    "--c-shell": t.shell,
    "--c-canvas": t.canvas,
    "--c-surface": t.surface,
    "--c-surfaceHover": t.surfaceHover,
    "--c-popover": t.popover,
    "--c-tile": t.tile,
    "--c-border": t.border,
    "--c-borderStrong": t.borderStrong,
    "--c-borderHover": t.borderHover,
    "--c-text": t.text,
    "--c-text2": t.text2,
    "--c-text3": t.text3,
    "--c-text4": t.text4,
    "--c-text5": t.text5,
    "--c-primaryBg": t.primaryBg,
    "--c-primaryText": t.primaryText,
  } as React.CSSProperties;
}

export function FacetApp() {
  const { state, derived, actions } = useFacetController();
  const [systemDark, setSystemDark] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    // Defer the real value to post-mount so SSR and the first client render
    // agree (server has no matchMedia); this corrects it a tick later.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSystemDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const effectiveMode =
    state.themeMode === "system"
      ? systemDark
        ? "dark"
        : "light"
      : state.themeMode;
  const themeVars = themeVarsFor(
    (effectiveMode === "dark" ? DARK_THEME : LIGHT_THEME).t,
  );

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        overflow: "hidden",
        position: "relative",
        background: "var(--c-shell)",
        color: "var(--c-text)",
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
