import React from "react";
import { AlertTriangle, CloudOff, RotateCw } from "lucide-react";
import { t } from "../../i18n";

export default function ReaderSourceStatus({
  dataSource,
  lang = "fr",
  translationState = "idle",
  onRetryTranslation,
}) {
  const labels = lang === "ar"
    ? { text: "النص", translation: "الترجمة", unavailable: "غير متاحة", degraded: "وضع احتياطي" }
    : lang === "en"
      ? { text: "Text", translation: "Translation", unavailable: "Unavailable", degraded: "Fallback mode" }
      : { text: "Texte", translation: "Traduction", unavailable: "Indisponible", degraded: "Mode de secours" };

  const textIsDegraded = Boolean(dataSource?.degraded);
  const translationHasError = translationState === "error";

  // Provider names belong in the Sources page and reciter details. Keeping the
  // healthy state silent avoids a technical banner above every reading page.
  if (!textIsDegraded && !translationHasError) return null;

  return (
    <div className="reader-source-status" role="status" aria-live="polite" aria-atomic="true">
      {textIsDegraded ? (
        <span data-state="degraded">
          <CloudOff size={13} aria-hidden="true" />
          <b>{labels.text}</b>
          <em>{labels.degraded}</em>
        </span>
      ) : null}
      {translationHasError ? (
        <span data-state="error">
          <AlertTriangle size={13} aria-hidden="true" />
          <b>{labels.translation}</b>
          {labels.unavailable}
          {onRetryTranslation ? (
            // An inert "unavailable" left the reader with no way back to the
            // translation once the network returned; the strip now carries the
            // one action that can succeed.
            <button
              type="button"
              className="min-h-[2.75rem] rounded-full border border-[var(--border)] px-3 inline-flex items-center gap-1.5 text-[0.72rem] font-semibold text-[var(--text-secondary)] hover:bg-[rgba(var(--primary-rgb),0.08)] active:scale-95 transition-colors"
              onClick={onRetryTranslation}
            >
              <RotateCw size={12} aria-hidden="true" />
              {t("actions.retry", lang)}
            </button>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
