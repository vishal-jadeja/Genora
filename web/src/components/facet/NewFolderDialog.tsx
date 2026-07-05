"use client";

import { useEffect, useRef } from "react";
import { Hoverable } from "./Hoverable";
import { dialogCardStyle, PRIMARY } from "./styleHelpers";
import type { FacetActions } from "@/lib/facet/useFacetController";
import type { FacetState } from "@/lib/facet/types";

export interface NewFolderDialogProps {
  state: FacetState;
  actions: FacetActions;
}

export function NewFolderDialog({ state, actions }: NewFolderDialogProps) {
  const open = state.creatingFolder;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") actions.cancelNewFolder();
    };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, actions]);

  if (!open) return null;

  return (
    <>
      <div
        onClick={actions.cancelNewFolder}
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
            margin: "0 0 14px",
            fontFamily: "var(--font-newsreader), serif",
            fontWeight: 500,
            fontSize: 18,
            color: "var(--c-text)",
          }}
        >
          New folder
        </h2>
        <input
          ref={inputRef}
          value={state.newFolderDraft}
          onChange={(e) => actions.onNewFolderInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") actions.commitNewFolder();
          }}
          placeholder="Folder name…"
          style={{
            width: "100%",
            background: "var(--c-surface)",
            border: "1px solid var(--c-borderStrong)",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 14,
            color: "var(--c-text)",
            marginBottom: 20,
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Hoverable
            as="button"
            onClick={actions.cancelNewFolder}
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
            onClick={actions.commitNewFolder}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 600,
              background: PRIMARY,
              color: "var(--c-primaryText)",
            }}
          >
            Create
          </button>
        </div>
      </div>
    </>
  );
}
