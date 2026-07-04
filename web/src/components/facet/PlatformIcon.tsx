import type { PlatformId } from "@/lib/facet/types";

const BRAND: Record<PlatformId, string> = {
  linkedin: "#0A66C2",
  x: "#000000",
  reddit: "#FF4500",
  medium: "#000000",
  substack: "#FF6719",
};

export interface PlatformIconProps {
  platform: PlatformId;
  size?: number;
  active?: boolean;
}

export function PlatformIcon({
  platform,
  size = 20,
  active = true,
}: PlatformIconProps) {
  const px = size;
  const radius = Math.max(4, Math.round(size * 0.28));
  const bg = active ? BRAND[platform] : "var(--c-tile)";
  const mark = active ? "#ffffff" : "var(--c-text3)";
  const fontPx = Math.round(size * 0.5);
  const fontPxM = Math.round(size * 0.56);
  const glyphPx = Math.round(size * 0.56);

  return (
    <div
      style={{
        width: px,
        height: px,
        minWidth: px,
        borderRadius: radius,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "none",
        overflow: "hidden",
        transition: "background .15s ease",
      }}
    >
      {platform === "linkedin" && (
        <span
          style={{
            fontFamily: "var(--font-hanken-grotesk), sans-serif",
            fontWeight: 800,
            fontSize: fontPx,
            color: mark,
            letterSpacing: "-.03em",
            lineHeight: 1,
          }}
        >
          in
        </span>
      )}
      {platform === "x" && (
        <svg width={glyphPx} height={glyphPx} viewBox="0 0 24 24" fill="none">
          <path
            d="M4.5 4.5L19.5 19.5M19.5 4.5L4.5 19.5"
            stroke={mark}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </svg>
      )}
      {platform === "reddit" && (
        <svg width={glyphPx} height={glyphPx} viewBox="0 0 24 24" fill="none">
          <path
            d="M6 10.5l-2.2-2M18 10.5l2.2-2"
            stroke={mark}
            strokeWidth={1.4}
            strokeLinecap="round"
          />
          <circle cx="3.6" cy="8" r="1.5" fill={mark} />
          <circle cx="20.4" cy="8" r="1.5" fill={mark} />
          <ellipse cx="12" cy="14" rx="7.5" ry="6" fill={mark} />
          <circle cx="9.2" cy="13.6" r="1.15" fill={bg} />
          <circle cx="14.8" cy="13.6" r="1.15" fill={bg} />
          <path
            d="M9 16.6c1 .8 4 .8 6 0"
            stroke={bg}
            strokeWidth={1.1}
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="12" cy="7.6" r="1.4" fill={mark} />
          <path d="M12 9v-1" stroke={mark} strokeWidth={1.2} />
        </svg>
      )}
      {platform === "medium" && (
        <span
          style={{
            fontFamily: "Georgia, var(--font-newsreader), serif",
            fontWeight: 700,
            fontSize: fontPxM,
            color: mark,
            lineHeight: 1,
          }}
        >
          M
        </span>
      )}
      {platform === "substack" && (
        <svg width={glyphPx} height={glyphPx} viewBox="0 0 24 24" fill="none">
          <rect x="4" y="5" width="16" height="2.6" rx="1.3" fill={mark} />
          <rect x="4" y="10.2" width="16" height="2.6" rx="1.3" fill={mark} />
          <rect x="4" y="15.4" width="16" height="2.6" rx="1.3" fill={mark} />
          <path d="M4 19.5l8 3.5 8-3.5" fill={mark} />
        </svg>
      )}
    </div>
  );
}
