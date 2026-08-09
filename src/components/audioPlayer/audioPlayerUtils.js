export const MOBILE_BREAKPOINT = 1024;

export function isMobilePlayerViewport() {
  if (typeof window === "undefined") return false;
  if (window.innerWidth < 768) return true;
  if (window.innerWidth >= MOBILE_BREAKPOINT) return false;

  return (
    window.matchMedia?.("(pointer: coarse)").matches ||
    !window.matchMedia?.("(hover: hover)").matches
  );
}

const RECITER_COOLDOWN_STEPS_MS = [
  30 * 1000,
  8 * 60 * 1000,
  25 * 60 * 1000,
  90 * 60 * 1000,
  4 * 60 * 60 * 1000,
];

export function getReciterCooldownMs(failCount) {
  const safeFails = Math.max(1, Number(failCount) || 1);
  const idx = Math.min(RECITER_COOLDOWN_STEPS_MS.length - 1, safeFails - 1);
  return RECITER_COOLDOWN_STEPS_MS[idx];
}

export function formatAudioTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
