import React from "react";
import { useAppLocale } from "../../context/AppContext";
import { getSurahLigature } from "../../data/surahs";
import { getBasmalaText } from "../../data/basmala";
import { getSurahMeta } from "./mushafPageComposition";
import { useMushafSurface } from "./mushafSurface";

/**
 * MushafPageLines — the fifteen-line block of a printed page. Surah title
 * bands and basmala lines are identical in both riwayas; only the word row
 * differs, so the caller supplies renderWord and (for Warsh) a per-line
 * fit style.
 */
/**
 * The surah band is the page's one piece of non-Quran furniture. It carries
 * the name and nothing else: the number it used to hold repeated the running
 * head and the player badge. The name is the calligraphic surah-name face the
 * reader already sees in the header, the player and the sidebar -- a glyph
 * keyed by the surah number, with the plain Arabic name as its fallback --
 * and the accessible name of the band stays the full 'surah + name' phrase.
 *
 * On the reader's own page the band adds the question the print assumes away
 * -- what is this surah called in my language -- as a caption under the
 * calligraphy, in the interface face at clearly subordinate size.
 */
export function SurahHeaderLine({ surah, lineNumber }) {
  const surahMeta = getSurahMeta(surah);
  const name = surahMeta?.ar || surah;
  const ligature = getSurahLigature(surah);
  const { lang } = useAppLocale();
  const localized = useMushafSurface() === "pane" && lang !== "ar"
    ? (lang === "en" ? surahMeta?.en : surahMeta?.fr)
    : "";
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
        <span className="qcm-surah-title__stack">
          <span className="qcm-surah-title__name" dir="rtl" lang="ar">
            {ligature ? (
              <span
                className="qcm-surah-title__glyph font-surah-names"
                dir="ltr"
                lang="en"
                aria-hidden="true"
              >
                {ligature}
              </span>
            ) : (
              localized ? name : `سورة ${name}`
            )}
          </span>
          {localized ? (
            <span className="qcm-surah-title__localized" lang={lang}>
              {localized}
            </span>
          ) : null}
        </span>
      </span>
    </div>
  );
}

export function BasmalaLine({ lineNumber, riwaya, fallbackFontFamily }) {
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
