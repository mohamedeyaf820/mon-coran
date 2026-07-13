import React from "react";
import { Play, BookOpen, Download } from "lucide-react";
import { openExternalUrl } from "../../lib/security";

export default function RowActions({ lang, onPlay, onOpen, downloadUrl }) {
  const handleDownload = () => {
    if (!downloadUrl) return;
    openExternalUrl(downloadUrl);
  };

  const btnClass =
    "recitation-action-btn flex h-9 w-9 items-center justify-center rounded-xl text-text-muted hover:text-primary active:scale-95";

  return (
    <div className="recitation-row__actions flex items-center gap-1.5">
      <button
        className={btnClass}
        type="button"
        onClick={onPlay}
        title={
          lang === "fr" ? "Écouter la sourate" : lang === "ar" ? "استمع إلى السورة" : "Listen surah"
        }
        aria-label={lang === "fr" ? "Écouter" : lang === "ar" ? "استمع" : "Listen"}
      >
        <Play size={12} />
      </button>
      <button
        className={btnClass}
        type="button"
        onClick={onOpen}
        title={
          lang === "fr" ? "Ouvrir dans le lecteur" : lang === "ar" ? "فتح في القارئ" : "Open in reader"
        }
        aria-label={lang === "fr" ? "Ouvrir" : lang === "ar" ? "فتح" : "Open"}
      >
        <BookOpen size={12} />
      </button>
      <button
        className={`${btnClass} ${!downloadUrl ? "cursor-not-allowed opacity-40" : ""}`}
        type="button"
        onClick={handleDownload}
        disabled={!downloadUrl}
        title={
          downloadUrl
            ? lang === "fr"
              ? "Télécharger MP3"
              : lang === "ar"
                ? "تحميل MP3"
                : "Download MP3"
            : lang === "fr"
              ? "Téléchargement indisponible"
              : lang === "ar"
                ? "التنزيل غير متاح"
                : "Download unavailable"
        }
        aria-label={lang === "fr" ? "Télécharger" : lang === "ar" ? "تحميل" : "Download"}
      >
        <Download size={12} />
      </button>
    </div>
  );
}
