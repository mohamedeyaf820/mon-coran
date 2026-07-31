import React from "react";
import { BookOpen, Download, Play } from "lucide-react";
import { openExternalUrl } from "../../lib/security";

function labelsFor(lang) {
  if (lang === "ar") {
    return {
      listen: "استمع",
      open: "افتح في المصحف",
      download: "تحميل MP3",
      unavailable: "التحميل غير متاح",
    };
  }
  if (lang === "fr") {
    return {
      listen: "Écouter",
      open: "Ouvrir dans le lecteur",
      download: "Télécharger MP3",
      unavailable: "Téléchargement indisponible",
    };
  }
  return {
    listen: "Listen",
    open: "Open in reader",
    download: "Download MP3",
    unavailable: "Download unavailable",
  };
}

export default function RowActions({
  lang,
  surahLabel,
  onPlay,
  onOpen,
  onOpenIntent,
  downloadUrl,
}) {
  const labels = labelsFor(lang);
  const contextualLabel = (action) =>
    surahLabel ? `${action} — ${surahLabel}` : action;
  const handleDownload = () => {
    if (downloadUrl) openExternalUrl(downloadUrl);
  };

  return (
    <div className="recitation-row__actions">
      <button
        className="recitation-action-btn recitation-action-btn--primary"
        type="button"
        onClick={onPlay}
        title={contextualLabel(labels.listen)}
        aria-label={contextualLabel(labels.listen)}
      >
        <Play className="recitation-icon recitation-icon--sm" size={15} fill="currentColor" aria-hidden="true" />
        <span className="recitation-action-btn__label">{labels.listen}</span>
      </button>
      <button
        className="recitation-action-btn"
        type="button"
        onClick={onOpen}
        onPointerEnter={onOpenIntent}
        onPointerDown={onOpenIntent}
        onFocus={onOpenIntent}
        title={contextualLabel(labels.open)}
        aria-label={contextualLabel(labels.open)}
      >
        <BookOpen className="recitation-icon recitation-icon--sm" size={15} aria-hidden="true" />
      </button>
      <button
        className="recitation-action-btn"
        type="button"
        onClick={handleDownload}
        disabled={!downloadUrl}
        title={contextualLabel(downloadUrl ? labels.download : labels.unavailable)}
        aria-label={contextualLabel(downloadUrl ? labels.download : labels.unavailable)}
      >
        <Download className="recitation-icon recitation-icon--sm" size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
