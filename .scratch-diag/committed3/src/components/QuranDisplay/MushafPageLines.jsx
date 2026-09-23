import React from "react";
import { getSurahLigature } from "../../data/surahs";
import { getBasmalaText } from "../../data/basmala";
import { getSurahMeta } from "./mushafPageComposition";

/**
 * MushafPageLines — the fifteen-line block of a printed page. Surah title
 * bands and basmala lines are identical in both riwayas; only the word row
 * differs, so the caller supplies renderWord and (for Warsh) a per-line
 * fit style.
 */
export function SurahHeaderLine({ surah, lineNumber }) {
  const surahMeta = getSurahMeta(surah);
  return (
    <div
      className="qcm-line qcm-line--surah-header"
      data-line-number={lineNumber}
    >
      <span
        className="qcm-surah-title"
        role="heading"
        aria-level={2}
        aria-label={`سورة ${surahMeta?.ar || surah}`}
      >
        <span
          className="qcm-surah-title__name font-surah-names"
          dir="ltr"
          lang="en"
          aria-hidden="true"
        >
          {getSurahLigature(surah)}
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
  warsh = false,
}) {
  return (
    <div
      ref={linesRef}
      className="qcm-lines"
      dir="rtl"
      lang="ar"
      data-warsh={warsh ? "true" : undefined}
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
