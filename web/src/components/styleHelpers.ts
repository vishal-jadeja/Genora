import type { CSSProperties } from "react";
import { PLAT } from "@/lib/genora/data";
import type { PlatformId } from "@/lib/genora/types";

export const PRIMARY = "var(--c-primaryBg)";
export const GREEN = "#6cae8e";
export const AMBER = "#d4a960";
export const RED = "#d47a7a";

export function chipStyle(id: PlatformId, selected: boolean): CSSProperties {
  const meta = PLAT[id];
  return {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px 6px 7px",
    borderRadius: 999,
    border: `1px solid ${selected ? meta.color : "var(--c-borderStrong)"}`,
    background: selected ? meta.bg : "transparent",
    color: selected ? "var(--c-text)" : "var(--c-text3)",
    fontSize: 12.5,
    fontWeight: 500,
  };
}

export function monoStyle(id: PlatformId, selected: boolean): CSSProperties {
  const meta = PLAT[id];
  return {
    width: 18,
    height: 18,
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-jetbrains-mono), monospace",
    fontSize: 8.5,
    fontWeight: 600,
    background: selected ? meta.bg : "var(--c-tile)",
    color: selected ? meta.color : "var(--c-text3)",
  };
}

export function optStyle(selected: boolean): CSSProperties {
  return {
    display: "block",
    width: "100%",
    textAlign: "left",
    background: selected ? "var(--c-borderStrong)" : "transparent",
    border: "none",
    borderRadius: 7,
    padding: "8px 10px",
    fontSize: 13,
    color: "var(--c-text2)",
  };
}

export const moveOptStyle: CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  background: "none",
  border: "none",
  borderRadius: 6,
  padding: "7px 9px",
  fontSize: 12.5,
  color: "var(--c-text2)",
};

export function radioStyle(selected: boolean): CSSProperties {
  return {
    width: 16,
    height: 16,
    borderRadius: "50%",
    flex: "none",
    border: `1.5px solid ${selected ? "var(--c-text)" : "var(--c-borderHover)"}`,
    background: selected ? "var(--c-text)" : "transparent",
    boxShadow: selected ? "inset 0 0 0 3px var(--c-shell)" : "none",
  };
}

export const popoverStyle: CSSProperties = {
  position: "absolute",
  zIndex: 30,
  background: "var(--c-popover)",
  border: "1px solid var(--c-borderStrong)",
  borderRadius: 10,
  boxShadow: "0 14px 34px rgba(0,0,0,.6)",
  padding: 6,
  minWidth: 180,
  animation: "ffade .12s ease",
};

export const dialogCardStyle: CSSProperties = {
  position: "fixed",
  zIndex: 101,
  top: "50%",
  left: "50%",
  transform: "translate(-50%,-50%)",
  background: "var(--c-popover)",
  border: "1px solid var(--c-borderStrong)",
  borderRadius: 14,
  boxShadow: "0 20px 50px rgba(0,0,0,.55)",
  padding: 22,
  minWidth: 380,
  maxWidth: 440,
  animation: "dialogPop .15s ease",
};

export const modalCardStyle: CSSProperties = {
  position: "fixed",
  zIndex: 101,
  top: "50%",
  left: "50%",
  transform: "translate(-50%,-50%)",
  background: "var(--c-popover)",
  border: "1px solid var(--c-borderStrong)",
  borderRadius: 16,
  boxShadow: "0 20px 60px rgba(0,0,0,.6)",
  width: "min(920px, calc(100vw - 48px))",
  height: "min(640px, calc(100vh - 48px))",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  animation: "dialogPop .15s ease",
};

export function glassPanelStyle(extra?: CSSProperties): CSSProperties {
  return {
    background: "var(--c-glassBg)",
    backdropFilter: "blur(20px) saturate(140%)",
    WebkitBackdropFilter: "blur(20px) saturate(140%)",
    border: "1px solid var(--c-glassBorder)",
    borderRadius: 16,
    ...extra,
  };
}
