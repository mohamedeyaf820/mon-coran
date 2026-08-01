import React from "react";
import { AlertTriangle, CloudOff } from "lucide-react";

export default function ReaderSourceStatus({
  dataSource,
  lang = "fr",
  translationState = "idle",
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
        </span>
      ) : null}
    </div>
  );
}
