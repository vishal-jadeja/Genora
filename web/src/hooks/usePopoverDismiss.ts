"use client";

import { useEffect, type RefObject } from "react";

// Closes an open popover on an outside click or Escape — none of this
// codebase's popovers (move-to menus, folder pickers, model picker,
// version history) had either, mouse-only and no keyboard escape hatch.
export function usePopoverDismiss(
  ref: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onClose: () => void,
) {
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose, ref]);
}

// Same dismissal behavior for a popover rendered inline inside a `.map()` —
// a per-row ref isn't available there without breaking the rules of hooks
// (the parent component owns one hook call, not one per list item), so this
// matches by a `data-*` selector on the currently-open row's wrapper instead.
export function usePopoverDismissBySelector(
  isOpen: boolean,
  onClose: () => void,
  selector: string,
) {
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target?.closest(selector)) onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose, selector]);
}
