import React from "react";
import { AlertTriangle, CheckCircle2, Cloud, CloudOff, Loader2 } from "lucide-react";

export default function ReaderSourceStatus({ dataSource, lang = "fr", loading = false, translationSource, translationState = "idle" }) {
  const labels = lang === "ar"
    ? { text: "النص", translation: "الترجمة", loading: "جار التحميل", unavailable: "غير متاحة", degraded: "وضع احتياطي" }
    : lang === "en"
      ? { text: "Text", translation: "Translation", loading: "Loading", unavailable: "Unavailable", degraded: "Fallback mode" }
      : { text: "Texte", translation: "Traduction", loading: "Chargement", unavailable: "Indisponible", degraded: "Mode dégradé" };
  const TextIcon = loading ? Loader2 : dataSource?.degraded ? CloudOff : CheckCircle2;
  const TranslationIcon = translationState === "loading" ? Loader2 : translationState === "error" ? AlertTriangle : Cloud;

  return (
    <div className="reader-source-status" role="status" aria-live="polite" aria-atomic="true">
      <span data-state={loading ? "loading" : dataSource?.degraded ? "degraded" : "ready"}>
        <TextIcon size={13} className={loading ? "is-spinning" : ""} aria-hidden="true" />
        <b>{labels.text}</b>
        {loading ? labels.loading : dataSource?.label || labels.loading}
        {dataSource?.degraded ? <em>{labels.degraded}</em> : null}
      </span>
      {translationState !== "idle" ? (
        <span data-state={translationState}>
          <TranslationIcon size={13} className={translationState === "loading" ? "is-spinning" : ""} aria-hidden="true" />
          <b>{labels.translation}</b>
          {translationState === "loading" ? labels.loading : translationState === "error" ? labels.unavailable : translationSource}
        </span>
      ) : null}
    </div>
  );
}
