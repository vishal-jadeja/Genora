"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DARK_THEME, LIGHT_THEME } from "@/lib/facet/data";
import { useFacetController } from "@/lib/facet/useFacetController";
import { ConfirmDialog } from "./ConfirmDialog";
import { NewFolderDialog } from "./NewFolderDialog";
import type { FacetViewProps } from "./viewProps";

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
    "--c-glassBg": t.glassBg,
    "--c-glassBorder": t.glassBorder,
  } as React.CSSProperties;
}

const FacetContext = createContext<FacetViewProps | null>(null);

export function useFacet(): FacetViewProps {
  const ctx = useContext(FacetContext);
  if (!ctx) throw new Error("useFacet must be used inside <FacetProvider>");
  return ctx;
}

export function FacetProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const nav = useMemo(
    () => ({ push: router.push, replace: router.replace }),
    [router],
  );
  const { state, derived, actions } = useFacetController(nav);
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
    <FacetContext.Provider value={{ state, derived, actions }}>
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
        {children}
        <ConfirmDialog
          open={!!state.confirmDialog}
          title={derived.confirmDialogContent?.title ?? ""}
          description={derived.confirmDialogContent?.description ?? ""}
          confirmLabel={derived.confirmDialogContent?.confirmLabel}
          onConfirm={actions.confirmDialogAction}
          onCancel={actions.closeConfirmDialog}
        />
        <NewFolderDialog state={state} actions={actions} />
      </div>
    </FacetContext.Provider>
  );
}
