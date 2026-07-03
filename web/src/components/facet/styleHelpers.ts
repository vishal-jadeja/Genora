import type { CSSProperties } from "react";
import { PLAT } from "@/lib/facet/data";
import type { PlatformId } from "@/lib/facet/types";

export const PRIMARY = "#f0f0f0";
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
    color: selected ? "#ededed" : "#8f8f8f",
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
    color: selected ? meta.color : "#777",
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
    color: "#d6d6d6",
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
  color: "#c4c4c4",
};

export function radioStyle(selected: boolean): CSSProperties {
  return {
    width: 16,
    height: 16,
    borderRadius: "50%",
    flex: "none",
    border: `1.5px solid ${selected ? "#ededed" : "var(--c-borderHover)"}`,
    background: selected ? "#ededed" : "transparent",
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
