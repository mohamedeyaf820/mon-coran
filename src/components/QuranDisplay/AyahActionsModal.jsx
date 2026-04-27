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
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          "w-full max-w-lg rounded-2xl",
          "bg-[var(--bg-card)] border border-[var(--border)]",
          "shadow-2xl",
          "animate-in slide-in-from-bottom-2",
          "max-h-[80vh] overflow-y-auto",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <span className="font-[var(--font-ui)] text-sm font-semibold text-[var(--text-secondary)]">
            {surah}:{ayahData?.numberInSurah ?? activeAyah}
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)] transition-colors"
            aria-label="Fermer"
          >
            <i className="fas fa-times text-sm" />
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
