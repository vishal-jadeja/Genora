import type { CSSProperties } from "react";

export const ANTON = "var(--font-anton), sans-serif";
export const GROTESK = "var(--font-space-grotesk), sans-serif";
export const MONO = "var(--font-jetbrains-mono), monospace";

export const ORANGE = "#E8853A";
export const RED = "#D94E45";
export const TEAL = "#2A9D8F";
export const INK = "#0E0D0B";
export const TEXT = "#F2EEE7";
export const MUTED = "#8A8378";
export const MUTED2 = "#B4ADA1";
export const CARD = "#17140F";
export const CARD2 = "#141109";

export const linkStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: ".18em",
  textTransform: "uppercase",
  color: MUTED,
  textDecoration: "none",
};
