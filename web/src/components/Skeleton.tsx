import type { CSSProperties } from "react";

// Themed shimmer placeholder — the loading-state counterpart to
// ButtonSpinner. Matches the app's inline-style + CSS-var theming (see
// GenoraProvider's themeVarsFor) rather than Tailwind, since that's the
// established pattern across DashboardView/ComposeView/OutputView.
//
// The shimmer band itself can't use theme CSS vars in a static keyframe
// (background-position needs a gradient set here, inline, per-instance), so
// the gradient colors are read from the vars directly and the sweep motion
// lives in globals.css as `fshimmer`. Reduced-motion users get a static
// block via the `[data-skeleton]` rule in globals.css.
export function Skeleton({
  width = "100%",
  height = 14,
  radius = 6,
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: CSSProperties;
}) {
  const base: CSSProperties = {
    display: "block",
    width,
    height,
    borderRadius: radius,
    background: `linear-gradient(
      90deg,
      var(--c-tile) 25%,
      var(--c-surfaceHover) 50%,
      var(--c-tile) 75%
    )`,
    backgroundSize: "200% 100%",
    animation: "fshimmer 1.6s ease-in-out infinite",
    ...style,
  };
  return <span aria-hidden="true" data-skeleton style={base} />;
}

// Short stack of skeleton text lines — the last line runs shorter so the
// block reads as text rather than a solid bar.
export function SkeletonText({
  lines = 2,
  gap = 8,
  lineHeight = 12,
  lastLineWidth = "60%",
}: {
  lines?: number;
  gap?: number;
  lineHeight?: number;
  lastLineWidth?: number | string;
}) {
  return (
    <span
      style={{ display: "flex", flexDirection: "column", gap }}
      aria-hidden="true"
    >
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          width={i === lines - 1 ? lastLineWidth : "100%"}
        />
      ))}
    </span>
  );
}
