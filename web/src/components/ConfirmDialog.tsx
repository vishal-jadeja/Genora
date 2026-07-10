"use client";

import { useEffect } from "react";
import { Hoverable } from "./Hoverable";
import { dialogCardStyle, RED, PRIMARY } from "./styleHelpers";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <>
      <div
        onClick={onCancel}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "rgba(0,0,0,.5)",
          animation: "ffade .15s ease",
        }}
      />
      <div style={dialogCardStyle}>
        <h2
          style={{
            margin: "0 0 8px",
            fontFamily: "var(--font-newsreader), serif",
            fontWeight: 500,
            fontSize: 18,
            color: "var(--c-text)",
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: "0 0 20px",
            color: "var(--c-text3)",
            fontSize: 13.5,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <Hoverable
            as="button"
            onClick={onCancel}
            style={{
              background: "none",
              border: "1px solid var(--c-borderStrong)",
              borderRadius: 8,
              color: "var(--c-text2)",
              fontSize: 13,
              padding: "9px 15px",
            }}
            hoverStyle={{ borderColor: "var(--c-borderHover)" }}
          >
            Cancel
          </Hoverable>
          <button
            onClick={onConfirm}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 600,
              background: destructive ? RED : PRIMARY,
              color: destructive ? "#2a1010" : "var(--c-primaryText)",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
