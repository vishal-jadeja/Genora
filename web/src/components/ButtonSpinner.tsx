import type { CSSProperties } from "react";

export function ButtonSpinner({
  size = 13,
  color = "currentColor",
  trackColor = "var(--c-borderStrong)",
}: {
  size?: number;
  color?: string;
  trackColor?: string;
}) {
  const style: CSSProperties = {
    width: size,
    height: size,
    flex: "none",
    border: `2px solid ${trackColor}`,
    borderTopColor: color,
    borderRadius: "50%",
    animation: "fspin .8s linear infinite",
  };
  return <span aria-hidden="true" style={style} />;
}
