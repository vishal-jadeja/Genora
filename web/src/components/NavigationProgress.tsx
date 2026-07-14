"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  finishNavProgress,
  getNavProgress,
  startNavProgress,
  subscribeNavProgress,
} from "@/lib/navProgress";

const ACCENT = "#E8853A";

export function NavigationProgress() {
  const [{ progress, visible }, setState] = useState(getNavProgress());
  const pathname = usePathname();

  useEffect(() => subscribeNavProgress(() => setState(getNavProgress())), []);

  // The route actually changed — whatever triggered the navigation is done.
  useEffect(() => {
    finishNavProgress();
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement)?.closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      startNavProgress();
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: 3,
        width: `${progress * 100}%`,
        background: ACCENT,
        boxShadow: visible ? `0 0 8px ${ACCENT}` : "none",
        opacity: visible ? 1 : 0,
        transition:
          progress === 0
            ? "none"
            : "width 200ms ease-out, opacity 200ms ease-out",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    />
  );
}
