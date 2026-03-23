import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * toast(message, type?) — dispatch a global toast notification.
 * Listens for 'quran-toast' CustomEvent in App.jsx.
 *
 * @param {string} message - The text to display
 * @param {"info"|"success"|"error"|"warning"} type - Toast style (default: "info")
 *
 * @example
 * import { toast } from "../lib/utils";
 * toast("Verset copié !", "success");
 * toast("Erreur réseau", "error");
 */
export function toast(message, type = "info") {
  if (typeof window === "undefined") return;
    window.dispatchEvent(/* ... */); // 🚨 Si window undefined (SSR), crash
}
    window.dispatchEvent(
      new CustomEvent("quran-toast", { detail: { message, type } }),
    );
