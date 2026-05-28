import React from "react";
import { openExternalUrl } from "../../lib/security";

export default function RowActions({ lang, onPlay, onOpen, downloadUrl }) {
  const handleDownload = () => {
    if (!downloadUrl) return;
    openExternalUrl(downloadUrl);
  };

  const btnClass = "recitation-action-btn flex items-center justify-center w-9 h-9 rounded-full border border-border bg-bg-card/40 text-text-muted hover:text-primary hover:border-primary/40 hover:bg-[rgba(var(--primary-rgb),0.06)] active:scale-95 transition-all duration-200";

  return (
    <div className="recitation-row__actions flex items-center gap-1.5">
      <button
        className={btnClass}
        type="button"
        onClick={onPlay}
        title={lang === "fr" ? "Écouter la sourate" : "Listen surah"}
        aria-label={lang === "fr" ? "Écouter" : "Listen"}
      >
        <i className="fas fa-play text-[0.8rem]" />
      </button>
      <button
        className={btnClass}
        type="button"
        onClick={onOpen}
        title={lang === "fr" ? "Ouvrir dans le lecteur" : "Open in reader"}
        aria-label={lang === "fr" ? "Ouvrir" : "Open"}
      >
        <i className="fas fa-book-open text-[0.8rem]" />
      </button>
      <button
        className={`${btnClass} ${!downloadUrl ? "opacity-40 cursor-not-allowed" : ""}`}
        type="button"
        onClick={handleDownload}
        disabled={!downloadUrl}
        title={downloadUrl
          ? (lang === "fr" ? "Télécharger MP3" : "Download MP3")
          : (lang === "fr" ? "Téléchargement indisponible" : "Download unavailable")}
        aria-label={lang === "fr" ? "Télécharger" : "Download"}
      >
        <i className="fas fa-download text-[0.8rem]" />
      </button>
    </div>
  );
}
