import React from "react";
import AyahActions from "../AyahActions";
import { cn } from "../../lib/utils";

export default function AyahActionsModal({
  activeAyah,
  onClose,
  surah,
  ayahData,
}) {
  if (!activeAyah) return null;

  return (
    <div
      className="verse-context-modal fixed inset-0 z-40 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          "verse-context-modal__panel",
          "w-full max-w-lg rounded-2xl",
          "bg-[var(--bg-card)] border border-[var(--border)]",
          "shadow-2xl",
          "animate-in slide-in-from-bottom-2",
          "max-h-[80vh] overflow-y-auto",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="verse-context-modal__header flex items-center justify-between border-b border-[var(--border)] p-4">
          <div className="min-w-0">
            <span className="verse-context-modal__eyebrow">Actions du verset</span>
            <span className="verse-context-modal__ref font-[var(--font-ui)] text-sm font-semibold text-[var(--text-secondary)]">
              {surah}:{ayahData?.numberInSurah ?? activeAyah}
            </span>
          </div>
          <button
            onClick={onClose}
            className="verse-context-modal__close flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"
            aria-label="Fermer"
          >
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        {/* Corps */}
        <div className="verse-context-modal__body p-4">
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
