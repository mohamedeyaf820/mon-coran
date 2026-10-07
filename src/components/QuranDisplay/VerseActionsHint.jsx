import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const [leaving, setLeaving] = useState(false);
  const hintRef = useRef(null);
  // Height to give back to the scroll position once the hint is gone, when it
  // sat above what the reader was looking at.
  const giveBackRef = useRef(0);

  // The hint is in the flow, so removing it moves every verse up by its height
  // (about 50 px) - in the middle of a sentence if the reader is scrolled, and
  // the timer fires whether or not anybody is looking at it.
  const hide = () => {
    const node = hintRef.current;
    const scroller = node?.closest("#main-content");
    const above = Boolean(
      node && scroller && node.getBoundingClientRect().bottom <= scroller.getBoundingClientRect().top + 1,
    );
    if (above) {
      giveBackRef.current = node.offsetHeight + parseFloat(getComputedStyle(node).marginBottom || "0");
    }
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode: hide for this session only */
    }
    // In view: fold it away instead of snapping the verses up.
    const still = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (above || still) {
      setVisible(false);
      return;
    }
    setLeaving(true);
    setTimeout(() => setVisible(false), 280);
  };

  useLayoutEffect(() => {
    if (visible || !giveBackRef.current) return;
    const scroller = document.querySelector("#main-content");
    if (scroller) scroller.scrollTop = Math.max(0, scroller.scrollTop - giveBackRef.current);
    giveBackRef.current = 0;
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    const timer = setTimeout(hide, 8000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  const dismiss = hide;

  return (
    <div
      ref={hintRef}
      className="qc-verse-actions-hint mx-auto mb-2 flex w-full max-w-[min(100%,32rem)] items-center gap-2 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1 text-xs text-[var(--text-muted)] shadow-sm"
      style={{
        transition: "max-height 0.25s ease, opacity 0.2s ease, margin 0.25s ease, padding 0.25s ease",
        maxHeight: "5rem",
        ...(leaving ? { maxHeight: 0, opacity: 0, marginBottom: 0, paddingBlock: 0, borderWidth: 0 } : null),
      }}
    >
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
