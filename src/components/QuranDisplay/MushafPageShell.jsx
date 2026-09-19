import React from "react";

/**
 * MushafPageShell — the printed-page frame shared by every Mushaf surface
 * (immersive book and the inline reader stream): ornamental border, corner
 * rosettes, running head, folio footer and the side gutters. The caller
 * supplies the composed content (lines) as children so Hafs and Warsh
 * renderers keep their own composition while both surfaces stay pixel
 * identical.
 */
export default function MushafPageShell({
  children,
  currentPage,
  fontFailed = false,
  fontWarningText,
  lang,
  meta,
}) {
  return (
    <section className="qcm-page-shell" aria-label={`${lang === "ar" ? "صفحة" : "Page"} ${currentPage}`}>
      {fontFailed && fontWarningText && (
        <div className="qcm-font-warning" role="alert">
          <span>{fontWarningText}</span>
        </div>
      )}
      <div className="qcm-edge qcm-edge--start">
        <span>{meta.sideA}</span>
        <span>{meta.sideB}</span>
      </div>
      <div className="qcm-page">
        <span className="qcm-corner qcm-corner--tl" aria-hidden="true" />
        <span className="qcm-corner qcm-corner--tr" aria-hidden="true" />
        <span className="qcm-corner qcm-corner--bl" aria-hidden="true" />
        <span className="qcm-corner qcm-corner--br" aria-hidden="true" />
        <header className="qcm-page-header">
          <span className="qcm-page-header__meta">{meta.sideA}</span>
          <strong className="qcm-page-header__name">{meta.surahName}</strong>
          <span className="qcm-page-header__meta">{meta.top}</span>
        </header>
        {children}
        <footer className="qcm-page-footer" aria-hidden="true">
          <span className="qcm-page-folio">{meta.folio ?? meta.page}</span>
        </footer>
      </div>
      <div className="qcm-edge qcm-edge--end">
        <span>{meta.sideC || meta.sideB}</span>
        <span>{meta.folio ?? meta.page}</span>
      </div>
    </section>
  );
}
