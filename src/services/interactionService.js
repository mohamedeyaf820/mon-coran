export const APP_CONFIRM_EVENT = "mushafplus:confirm";

/**
 * Opens the application confirmation dialog without falling back to the
 * browser's unstyled, non-localized window.confirm UI.
 */
export function confirmAction(options = {}) {
  if (typeof window === "undefined") return Promise.resolve(false);

  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent(APP_CONFIRM_EVENT, {
        detail: {
          title: options.title || "",
          message: options.message || "",
          confirmLabel: options.confirmLabel || "",
          cancelLabel: options.cancelLabel || "",
          tone: options.tone === "danger" ? "danger" : "default",
          resolve,
        },
      }),
    );
  });
}
