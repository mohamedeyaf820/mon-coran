import React from "react";
import { toAr } from "../../data/surahs";
import { getBasmalaText } from "../../data/basmala";
import { getSurahMeta } from "./mushafPageComposition";

/**
 * MushafPageLines — the fifteen-line block of a printed page. Surah title
 * bands and basmala lines are identical in both riwayas; only the word row
 * differs, so the caller supplies renderWord and (for Warsh) a per-line
 * fit style.
 */
/**
 * The surah band is the page's one piece of non-Quran furniture, and readers
 * must be able to *read* it: the band carries the plain Arabic name ("سورة
 * الحاقة") plus its number in a small gilded rosette, the way the Madani
 * print closes the band. The old "surahnames" ligature set the name from a
 * Latin digit code ("069"); at phone sizes it read as unreadable ornament,
 * so it is no longer part of the band.
 */
export function SurahHeaderLine({ surah, lineNumber }) {
  const surahMeta = getSurahMeta(surah);
  const name = surahMeta?.ar || surah;
  return (
    <div
      className="qcm-line qcm-line--surah-header"
      data-line-number={lineNumber}
    >
      <span
        className="qcm-surah-title"
        role="heading"
        aria-level={2}
        aria-label={`سورة ${name}`}
      >
        <span className="qcm-surah-title__name" dir="rtl" lang="ar">
          سورة {name}
        </span>
        <span className="qcm-surah-title__num" dir="rtl" aria-hidden="true">
          {toAr(Number(surah))}
        </span>
      </span>
    </div>
  );
}

export function BasmalaLine({ surah, lineNumber, riwaya, fallbackFontFamily }) {
  return (
    <div
      className="qcm-line qcm-line--basmala"
      data-line-number={lineNumber}
    >
      <span
        className="qcm-basmala"
        lang="ar"
        style={{ fontFamily: fallbackFontFamily }}
      >
        {getBasmalaText(riwaya)}
      </span>
    </div>
  );
}

export default function MushafPageLines({
  fallbackFontFamily,
  lineStyleFor,
  lines,
  linesRef,
  renderWord,
  riwaya,
  tajweed = false,
  warsh = false,
}) {
  return (
    <div
      ref={linesRef}
      className="qcm-lines"
      dir="rtl"
      lang="ar"
      data-warsh={warsh ? "true" : undefined}
      data-tajweed={tajweed ? "on" : undefined}
    >
      {lines.map((line) => {
        if (line.kind === "surah-header") {
          return (
            <SurahHeaderLine key={line.lineNumber} surah={line.surah} lineNumber={line.lineNumber} />
          );
        }
        if (line.kind === "basmala") {
          return (
            <BasmalaLine
              key={line.lineNumber}
              surah={line.surah}
              lineNumber={line.lineNumber}
              riwaya={riwaya}
              fallbackFontFamily={fallbackFontFamily}
            />
          );
        }
        const lineClass = line.words.length === 0
          ? "qcm-line qcm-line--empty"
          : line.endsSurah
            ? "qcm-line qcm-line--surah-end"
            : "qcm-line";
        return (
          <div
            key={line.lineNumber}
            className={lineClass}
            data-line-number={line.lineNumber}
            style={lineStyleFor ? lineStyleFor(line.lineNumber) : undefined}
          >
            {line.words.map(renderWord)}
          </div>
        );
      })}
    </div>
  );
}
