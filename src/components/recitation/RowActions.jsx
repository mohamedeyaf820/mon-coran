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

export default function RowActions({ lang, onPlay, onOpen, downloadUrl }) {
  const labels = labelsFor(lang);
  const handleDownload = () => {
    if (downloadUrl) openExternalUrl(downloadUrl);
  };

  return (
    <div className="recitation-row__actions">
      <button
        className="recitation-action-btn recitation-action-btn--primary"
        type="button"
        onClick={onPlay}
        title={labels.listen}
        aria-label={labels.listen}
      >
        <Play size={15} fill="currentColor" aria-hidden="true" />
        <span className="recitation-action-btn__label">{labels.listen}</span>
      </button>
      <button
        className="recitation-action-btn"
        type="button"
        onClick={onOpen}
        title={labels.open}
        aria-label={labels.open}
      >
        <BookOpen size={15} aria-hidden="true" />
      </button>
      <button
        className="recitation-action-btn"
        type="button"
        onClick={handleDownload}
        disabled={!downloadUrl}
        title={downloadUrl ? labels.download : labels.unavailable}
        aria-label={downloadUrl ? labels.download : labels.unavailable}
      >
        <Download size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
