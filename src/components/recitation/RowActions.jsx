import React from "react";

export default function RowActions({ lang, onPlay, onOpen, downloadUrl }) {
  return (
    <div className="flex items-center gap-1">
      <button className="hp2-icon-btn" type="button" onClick={onPlay} title={lang === "fr" ? "Ecouter" : "Listen"}><i className="fas fa-play" /></button>
      <button className="hp2-icon-btn" type="button" onClick={onOpen} title={lang === "fr" ? "Ouvrir" : "Open"}><i className="fas fa-book-open" /></button>
      {downloadUrl ? (
        <a className="hp2-icon-btn" href={downloadUrl} target="_blank" rel="noopener noreferrer" title={lang === "fr" ? "Telecharger" : "Download"}><i className="fas fa-download" /></a>
      ) : (
        <span className="hp2-icon-btn opacity-40" title={lang === "fr" ? "Download indisponible" : "Download unavailable"}><i className="fas fa-download" /></span>
      )}
    </div>
  );
}
