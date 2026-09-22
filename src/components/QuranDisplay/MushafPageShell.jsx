import React from "react";
import { toAr } from "../../data/surahs";
import { AyahRosette } from "./MushafAyahMarker";
import MushafOpeningFrame from "./MushafOpeningFrame";

// The Madani mushaf illuminates its two opening leaves (al-Fatiha and the
// start of al-Baqarah) with a framed panel instead of the plain running
// frame. Both sheets are derived here rather than passed down so the
// immersive overlay and the inline stream stay pixel identical.
const OPENING_PAGE_LAST = 2;

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
  noticeTone = "error",
  lang,
  meta,
}) {
  const isOpening = Number(currentPage) <= OPENING_PAGE_LAST;
  return (
    <section
      className="qcm-page-shell"
      data-page={currentPage}
      data-page-kind={isOpening ? "opening" : undefined}
      aria-label={`${lang === "ar" ? "صفحة" : "Page"} ${lang === "ar" ? toAr(currentPage) : currentPage}`}
    >
      {fontFailed && fontWarningText && (
        // A failed font is an event worth announcing; the flow sheet's
        // "layout adjusted" caption repeats on every page of the stream, so
        // it stays plain text and is read in document order instead.
        <div className="qcm-font-warning" data-tone={noticeTone} role={noticeTone === "error" ? "alert" : undefined}>
          <span>{fontWarningText}</span>
        </div>
      )}
      <div className="qcm-edge qcm-edge--start" lang="ar" dir="rtl">
        <span>{meta.sideA}</span>
        <span>{meta.sideB}</span>
      </div>
      <div className="qcm-page">
        {isOpening && <MushafOpeningFrame />}
        <span className="qcm-corner qcm-corner--tl" aria-hidden="true" />
        <span className="qcm-corner qcm-corner--tr" aria-hidden="true" />
        <span className="qcm-corner qcm-corner--bl" aria-hidden="true" />
        <span className="qcm-corner qcm-corner--br" aria-hidden="true" />
        {/* The running head is part of the printed page: always Arabic, like
            the Madani folio. It names the surah and the folio only — the juz,
            hizb and rub' are structural marks and live in the outer margin,
            where the print sets them, rather than being printed twice. */}
        <header className="qcm-page-header" lang="ar" dir="rtl">
          <strong className="qcm-page-header__name" title={meta.surahNameLocalized}>
            {meta.surahName}
          </strong>
          <span className="qcm-page-header__meta">{meta.top}</span>
        </header>
        {children}
        <footer className="qcm-page-footer" aria-hidden="true">
          <span className="qcm-page-folio">
            <AyahRosette className="qcm-rosette--folio" number={Number(currentPage)} />
          </span>
        </footer>
      </div>
      <div className="qcm-edge qcm-edge--end" lang="ar" dir="rtl">
        {meta.sideC && <span>{meta.sideC}</span>}
        <span>{meta.folio ?? meta.page}</span>
      </div>
    </section>
  );
}
