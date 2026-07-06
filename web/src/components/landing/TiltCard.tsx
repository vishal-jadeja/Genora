"use client";

import type { CSSProperties, ReactNode } from "react";
import { useRef } from "react";
import { usePrefersReducedMotion } from "./useReducedMotion";

export function TiltCard({
  style,
  children,
}: {
  style: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();

  return (
    <article
      ref={ref as React.RefObject<HTMLElement>}
      style={{
        transition: "transform .3s cubic-bezier(.2,.8,.2,1)",
        ...style,
      }}
      onMouseMove={(e) => {
        if (reduced.current || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        ref.current.style.transform = `perspective(900px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg) translateY(-6px)`;
      }}
      onMouseLeave={() => {
        if (ref.current)
          ref.current.style.transform =
            "perspective(900px) rotateY(0) rotateX(0) translateY(0)";
      }}
    >
      {children}
    </article>
  );
}
