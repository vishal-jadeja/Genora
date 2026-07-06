"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { CARD2, MUTED } from "./constants";

export function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      data-reveal=""
      style={{
        position: "relative",
        background: CARD2,
        border: `1px solid ${hover ? "rgba(232,133,58,.55)" : "rgba(242,238,231,.1)"}`,
        borderRadius: 10,
        padding: 30,
        boxShadow: hover
          ? "0 0 0 1px rgba(232,133,58,.25), 0 24px 60px -30px rgba(232,133,58,.5)"
          : "none",
        transition: "border-color .3s, box-shadow .3s",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          position: "relative",
          marginBottom: 22,
        }}
      >
        {icon}
      </div>
      <h3 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 600 }}>
        {title}
      </h3>
      <p style={{ margin: 0, color: MUTED, fontSize: 15, lineHeight: 1.6 }}>
        {description}
      </p>
    </div>
  );
}
