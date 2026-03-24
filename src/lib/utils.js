import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Dispatch a global toast notification.
 * App.jsx listens for the "quran-toast" custom event.
 */
export function toast(message, type = "info") {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("quran-toast", {
      detail: { message, type },
    }),
  );
}
