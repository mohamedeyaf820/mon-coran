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
          const surahMeta = getSurahMeta(line.surah);
          return (
            <div
              key={line.lineNumber}
              className="qcm-line qcm-line--surah-header"
              data-line-number={line.lineNumber}
            >
              <span
                className="qcm-surah-title"
                role="heading"
                aria-level={2}
                aria-label={`سورة ${surahMeta?.ar || line.surah}`}
              >
                <span
                  className="qcm-surah-title__name font-surah-names"
                  dir="ltr"
                  lang="en"
                  aria-hidden="true"
                >
                  {getSurahLigature(line.surah)}
                </span>
              </span>
            </div>
          );
        }
        if (line.kind === "basmala") {
          return (
            <div
              key={line.lineNumber}
              className="qcm-line qcm-line--basmala"
              data-line-number={line.lineNumber}
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
