type Listener = () => void;

let progress = 0;
let visible = false;
let tickTimer: ReturnType<typeof setInterval> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let safetyTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribeNavProgress(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getNavProgress() {
  return { progress, visible };
}

export function startNavProgress() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  if (safetyTimer) clearTimeout(safetyTimer);

  visible = true;
  progress = 0.08;
  emit();

  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    // Ease toward 90% — never reaches 100% on its own, that only
    // happens once the destination route actually renders.
    progress += (0.9 - progress) * 0.1;
    emit();
  }, 200);

  // If a navigation never resolves (blocked redirect, dropped request),
  // don't leave the bar stuck on screen forever.
  safetyTimer = setTimeout(finishNavProgress, 6000);
}

export function finishNavProgress() {
  if (!visible) return;
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  if (safetyTimer) {
    clearTimeout(safetyTimer);
    safetyTimer = null;
  }

  progress = 1;
  emit();
  hideTimer = setTimeout(() => {
    visible = false;
    progress = 0;
    emit();
    hideTimer = null;
  }, 200);
}
