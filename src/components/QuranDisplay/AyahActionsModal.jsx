import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import AyahActions from "../AyahActions";
import { cn } from "../../lib/utils";
import { useAppLocale } from "../../context/AppContext";
import { t } from "../../i18n";

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function AyahActionsModal({
  activeAyah,
  onClose,
  surah,
  ayahData,
  quietBackdrop = false,
}) {
  const { lang } = useAppLocale();
  const dialogRef = useRef(null);
  const titleId = `aam-title-${activeAyah}`;

  // Focus trap + Escape
  useEffect(() => {
    if (!activeAyah) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const prevFocus = document.activeElement;
    const firstFocusable = dialog.querySelector(FOCUSABLE);
    firstFocusable?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const focusables = [...dialog.querySelectorAll(FOCUSABLE)];
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      prevFocus?.focus();
    };
  }, [activeAyah, onClose]);

  if (!activeAyah) return null;

  return (
    <div
      className={cn(
        "ayah-actions-modal fixed inset-0 z-40 flex items-end justify-center p-3 sm:items-center sm:p-4",
        quietBackdrop
          ? "ayah-actions-modal--quiet bg-transparent"
          : "bg-black/40 backdrop-blur-sm",
      )}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        ref={dialogRef}
        className={cn(
          "w-full max-w-lg rounded-2xl",
          "bg-[var(--bg-card)] border border-[var(--border)]",
          quietBackdrop ? "shadow-xl" : "shadow-2xl",
          "animate-in slide-in-from-bottom-2",
          "max-h-[80vh] overflow-y-auto",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <span
            id={titleId}
            className="font-[var(--font-ui)] text-sm font-semibold text-[var(--text-secondary)]"
          >
            {surah}:{ayahData?.numberInSurah ?? activeAyah}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)] transition-colors"
            aria-label={t("audio.close", lang)}
          >
            <X size={16} />
          </button>
        </div>

        {/* Corps */}
        <div className="p-4">
          <AyahActions
            surah={surah}
            ayah={ayahData?.numberInSurah ?? activeAyah}
            ayahData={ayahData}
          />
        </div>
      </div>
    </div>
  );
}
