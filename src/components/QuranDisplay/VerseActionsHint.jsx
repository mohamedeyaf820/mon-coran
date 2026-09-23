import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { t } from "../../i18n";

const DISMISS_KEY = "mushaf-plus-verse-actions-hint-dismissed";

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * One-time coach mark telling readers that the ayah marker opens its actions.
 * Inline (never overlays the Quran text) and dismissed permanently on close or
 * after the auto-fade timer.
 */
export default function VerseActionsHint({ lang }) {
  const [visible, setVisible] = useState(() => !readDismissed());

  useEffect(() => {
    if (!visible) return undefined;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        /* private mode: hide for this session only */
      }
      setVisible(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div className="qc-verse-actions-hint mx-auto mb-2 flex w-full max-w-[min(100%,32rem)] items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1 text-xs text-[var(--text-muted)] shadow-sm">
      <span aria-hidden="true" className="text-base leading-none text-[var(--primary)]">
        {"۝"}
      </span>
      <p className="min-w-0 flex-1 text-start">{t("quran.verseActionsHint", lang)}</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("common.close", lang)}
        className="flex min-h-[2.75rem] min-w-[2.75rem] shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"
      >
        <X size={14} />
      </button>
    </div>
  );
}
