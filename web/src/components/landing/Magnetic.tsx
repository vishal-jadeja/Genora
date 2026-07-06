"use client";

import type { CSSProperties, ElementType, ReactNode } from "react";
import { useRef } from "react";
import { usePrefersReducedMotion } from "./useReducedMotion";

export function Magnetic({
  as = "div",
  className,
  style,
  children,
  ...rest
}: {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  [key: string]: unknown;
}) {
  const Tag = as as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        transition: "transform .25s cubic-bezier(.2,.8,.2,1)",
        ...style,
      }}
      onMouseMove={(e: React.MouseEvent) => {
        if (reduced.current || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        ref.current.style.transform = `translate(${dx * 0.28}px, ${dy * 0.34}px)`;
      }}
      onMouseLeave={() => {
        if (ref.current) ref.current.style.transform = "translate(0,0)";
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
