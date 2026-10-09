import { useCallback } from "react";

/**
 * Pure key→intent decision, previously inlined in AudioPlayer's
 * handleProgressKeyDown. In Arabic the horizontal arrows swap so the key
 * direction follows the reading direction; vertical arrows never swap.
 */
export function getDirectionIntent(key, lang) {
  const rtl = lang === "ar";
  const leftKey = rtl ? "ArrowRight" : "ArrowLeft";
  const rightKey = rtl ? "ArrowLeft" : "ArrowRight";
  if (key === leftKey || key === "ArrowDown") return "decrease";
  if (key === rightKey || key === "ArrowUp") return "increase";
  if (key === "Home") return "start";
  if (key === "End") return "end";
  return null;
}

/** Maps an intent to the clamped [0, 1] target value for the slider. */
export function computeDirectionTarget(intent, value, step = 0.05) {
  let next;
  if (intent === "decrease") next = value - step;
  else if (intent === "increase") next = value + step;
  else if (intent === "start") next = 0;
  else next = 1;
  return Math.max(0, Math.min(1, next));
}

/**
 * RTL-aware keyboard handler for 0..1 sliders (progress bars).
 * Returns a keyDown handler; `onSeek` receives the clamped target.
 */
export function useDirectionAwareKeys({ lang, value, step = 0.05, onSeek }) {
  return useCallback(
    (event) => {
      const intent = getDirectionIntent(event.key, lang);
      if (!intent) return;
      event.preventDefault();
      onSeek(computeDirectionTarget(intent, value, step));
    },
    [lang, onSeek, step, value],
  );
}

export default useDirectionAwareKeys;
