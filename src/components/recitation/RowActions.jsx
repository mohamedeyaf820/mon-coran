import React from "react";
import { openExternalUrl } from "../../lib/security";

export default function RowActions({ lang, onPlay, onOpen, downloadUrl }) {
  const handleDownload = () => {
    if (!downloadUrl) return;
    openExternalUrl(downloadUrl);
  };

  return (
    <div className="flex items-center gap-1">
      <button className="hp2-icon-btn" type="button" onClick={onPlay} title={lang === "fr" ? "Ecouter" : "Listen"} aria-label={lang === "fr" ? "Ecouter" : "Listen"}><i className="fas fa-play" /></button>
      <button className="hp2-icon-btn" type="button" onClick={onOpen} title={lang === "fr" ? "Ouvrir" : "Open"} aria-label={lang === "fr" ? "Ouvrir" : "Open"}><i className="fas fa-book-open" /></button>
      {downloadUrl ? (
        <button className="hp2-icon-btn" type="button" onClick={handleDownload} title={lang === "fr" ? "Telecharger" : "Download"} aria-label={lang === "fr" ? "Telecharger" : "Download"}><i className="fas fa-download" /></button>
      ) : (
        <span className="hp2-icon-btn opacity-40" title={lang === "fr" ? "Download indisponible" : "Download unavailable"}><i className="fas fa-download" /></span>
      )}
    </div>
  );
}
