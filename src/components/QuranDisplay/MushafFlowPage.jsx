import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getPerWordTajweedColors } from "../../data/tajwidRules";
import { getJuzOpeningAtAyah } from "../../data/juz";
import { playWordAudio } from "../../utils/wordAudio";
import { normalizeArabicText, getVerseKey } from "./mushafPageComposition";
import { BasmalaLine, SurahHeaderLine } from "./MushafPageLines";
import MushafAyahMarker from "./MushafAyahMarker";
import MushafPageShell from "./MushafPageShell";
import { t } from "../../i18n";

// The Mushaf sheet printed with a proportional web face (any riwaya whose
// selected font is not a per-page QCF glyph font) flows like the Madinah
// mushaf: ayahs run continuously, the browser breaks the lines, and the page
// fills exactly fifteen of them. Line breaks are typographic, never a per-ayah
// claim the dataset cannot support. A surah opening breaks the flow for its
// title band and basmala, then a fresh flow segment starts below, and the short
// last line of each segment is centred, as printed.
const MUSHAF_PAGE_LINES = 15;
// Smallest type the fit loop may print, as a fraction of the page body size.
const MIN_LINE_FIT = 0.45;
// The loop only ever shrinks. A printed Madani page keeps one glyph size for
// the whole mushaf and lets a short page — page 1, a closing surah — end with
// blank lines; inflating the type to reach fifteen lines instead gives the
// reader 40 px glyphs on Al-Fatiha and still leaves the sheet empty.
const MAX_LINE_FIT = 1;
// A narrow phone fits fifteen dense lines only in micro-glyphs. Below this
// rendered size the sheet stops shrinking and grows past fifteen lines
// instead, reporting the adjusted-layout notice: legibility outranks the
// line count, the text itself never changes.
const MIN_LEGIBLE_FLOW_PX = 15;

/**
 * Turn ayahs into flow segments. `getWords(ayah)` returns the printable word
 * list for the riwaya and face in use; the rule array is aligned 1:1 with it
 * because getPerWordTajweedColors splits on whitespace the same way.
 */
export function buildFlowSegments(ayahs, { getWords, riwaya, showTajwid }) {
  const segments = [];
  let flow = null;

  ayahs.forEach((ayah) => {
    const surah = ayah.surah?.number;
    const ayahNum = ayah.numberInSurah;
    const words = getWords(ayah) || [];
    if (words.length === 0) return;

    if (Number(ayahNum) === 1) {
      segments.push({ kind: "surah-header", surah });
      // Every surah but At-Tawbah carries its own basmala band, and in the
      // Warsh count the Fatiha basmala is not verse 1.
      if (Number(surah) !== 9) segments.push({ kind: "basmala", surah });
      flow = null;
    }
    if (!flow) {
      flow = { kind: "flow", tokens: [] };
      segments.push(flow);
    }
    const rules = showTajwid
      ? getPerWordTajweedColors(words.join(" "), riwaya)
      : [];
    words.forEach((text, idx) => {
      flow.tokens.push({
        charType: "word",
        globalAyah: ayah.number,
        surah,
        ayah: ayahNum,
        position: idx + 1,
        text,
        ruleId: rules[idx] || null,
      });
    });
    flow.tokens.push({
      charType: "end",
      globalAyah: ayah.number,
      surah,
      ayah: ayahNum,
    });
  });

  return segments;
}

export default function MushafFlowPage({
  activeAyah,
  currentPage,
  currentPlayingAyah,
  fallbackFontFamily,
  fitSignal,
  lang,
  meta,
  onToggleActive,
  riwaya,
  segments,
  showTajwid,
}) {
  // Flow words are proportional text in a web font, not QCF cut glyphs: a font
  // that fails to load still renders readable text, so the sheet never shows
  // the QCF font warning. Load completion only matters as a re-measure signal.
  const [flowFit, setFlowFit] = useState(1);
  const [fitDegraded, setFitDegraded] = useState(false);
  const linesRef = useRef(null);
  const fitPassRef = useRef(0);
  const fitKeyRef = useRef("");

  useLayoutEffect(() => {
    if (!linesRef.current) return undefined;

    // A new page, font or segment set restarts the refinement budget. Row
    // count is proportional to the type size (bigger glyphs fit fewer words per
    // line), so each pass multiplies the fit by target/rows until the segments
    // fill exactly the fifteen printed lines.
    const inputKey = `${currentPage}|${fitSignal}|${segments.length}`;
    if (fitKeyRef.current !== inputKey) {
      fitKeyRef.current = inputKey;
      fitPassRef.current = 0;
    }
    if (fitPassRef.current >= 10) return undefined;

    let frame = 0;
    let disposed = false;

    const measure = () => {
      if (disposed || fitPassRef.current >= 10) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (disposed || !linesRef.current) return;
        const root = linesRef.current;
        const flows = [...root.querySelectorAll(".qcm-flow")];
        if (flows.length === 0) return;
        const openingRows = root.querySelectorAll(".qcm-line").length;
        // Which contract this surface imposes, declared by its own stylesheet:
        // the immersive book keeps the fifteen printed lines, while the reading
        // pane sets the body to the column width and lets the leaf grow as tall
        // as its text — zero means there is no line count to hit.
        const declaredLines = Number.parseInt(
          getComputedStyle(root).getPropertyValue("--qcm-page-lines"),
          10,
        );
        const pageLines = Number.isFinite(declaredLines) ? declaredLines : MUSHAF_PAGE_LINES;
        const target = pageLines - openingRows;
        let rows = 0;
        flows.forEach((flow) => {
          const pitch = Number.parseFloat(getComputedStyle(flow).lineHeight) || 1;
          rows += Math.max(1, Math.round(flow.offsetHeight / pitch));
        });
        if (target <= 0) return;
        const basePx = Number.parseFloat(getComputedStyle(root).fontSize) || 1;
        const floor = Math.max(MIN_LINE_FIT, MIN_LEGIBLE_FLOW_PX / basePx);

        setFlowFit((current) => {
          // The legibility floor outranks the no-growth ceiling: on a narrow
          // phone the measured body is already below 15 px before the fit, so
          // capping at 1 there would print micro-glyphs. Growth is allowed
          // only up to what legibility demands, never to reach fifteen lines.
          const next = Math.max(floor, Math.min(MAX_LINE_FIT, current * (target / rows)));
          if (Math.abs(next - current) < 0.004) {
            // Converged: the notice fires only when the legibility floor holds
            // the type up and the page therefore runs past fifteen lines.
            setFitDegraded(current <= floor + 0.001 && rows > target);
            fitPassRef.current = 10;
            return current;
          }
          fitPassRef.current += 1;
          if (fitPassRef.current < 10) {
            window.setTimeout(measure, 60);
          } else {
            setFitDegraded(next <= floor + 0.001 && rows > target);
          }
          return next;
        });
      });
    };

    measure();
    const onResize = () => {
      fitKeyRef.current = "";
      setFlowFit(1);
      setFitDegraded(false);
      window.setTimeout(measure, 120);
    };
    window.addEventListener("resize", onResize);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, [currentPage, fitSignal, segments]);

  const renderToken = (token, index) => {
    const verseKey = getVerseKey(token);
    const isPlaying =
      currentPlayingAyah?.surah === token.surah &&
      currentPlayingAyah?.ayah === token.ayah;
    const isActive = activeAyah === token.globalAyah;

    if (token.charType === "end") {
      const juzOpening = getJuzOpeningAtAyah(token.surah, token.ayah);
      return (
        <MushafAyahMarker
          key={`${verseKey}:end:${index}`}
          num={token.ayah}
          isPlaying={isPlaying}
          juz={Boolean(juzOpening)}
          onClick={onToggleActive ? () => onToggleActive(token.globalAyah) : undefined}
        />
      );
    }

    return (
      <span
        key={`${verseKey}:${token.position || index}`}
        className={`qcm-word qcm-word--flow${riwaya === "warsh" ? " qcm-word--warsh" : ""}${isPlaying ? " qcm-word--playing" : ""}${isActive ? " qcm-word--active" : ""}`}
        data-surah-number={token.surah}
        data-ayah-number={token.ayah}
        data-ayah-global={token.globalAyah}
        data-word-position={token.position}
        data-tajwid={token.ruleId || undefined}
        role="button"
        tabIndex={0}
        onClick={() => {
          playWordAudio(token.audioUrl || { surah: token.surah, ayah: token.ayah, position: token.position });
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            playWordAudio(token.audioUrl || { surah: token.surah, ayah: token.ayah, position: token.position });
          }
        }}
        style={{
          // --qd-font-family is the reader's own choice. --font-quran cannot be
          // the only source: the Warsh display element re-declares it above the
          // inline stamp, so it resolves to the fixed Madinah stack and every
          // face in the picker prints as KFGQPC Warsh.
          fontFamily: "var(--qd-font-family, var(--font-quran))",
          fontSize: "1em",
          lineHeight: "inherit",
          letterSpacing: 0,
          textRendering: "optimizeLegibility",
          WebkitFontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1, "mark" 1, "mkmk" 1',
          fontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1, "mark" 1, "mkmk" 1',
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          unicodeBidi: "isolate",
          whiteSpace: "nowrap",
          // The sheet paints the rule colour through --qcm-word-tajwid so the
          // hover/active/focus ink rules keep winning over a plain colour.
          ...(token.ruleId ? { "--qcm-word-tajwid": `var(--tajwid-${token.ruleId})` } : {}),
        }}
      >
        {normalizeArabicText(token.text)}
      </span>
    );
  };

  let rowNumber = 0;
  return (
    <MushafPageShell
      currentPage={currentPage}
      fontFailed={fitDegraded}
      fontWarningText={fitDegraded ? t("quran.mushafDegradedNotice", lang) : undefined}
      noticeTone="quiet"
      lang={lang}
      meta={meta}
    >
      <div
        ref={linesRef}
        className="qcm-lines"
        dir="rtl"
        lang="ar"
        data-flow="true"
        data-warsh={riwaya === "warsh" ? "true" : undefined}
        data-tajweed={showTajwid ? "on" : undefined}
        style={{ "--qcm-flow-fit": flowFit }}
      >
        {segments.map((segment, index) => {
          if (segment.kind === "surah-header") {
            rowNumber += 1;
            return (
              <SurahHeaderLine key={`h${index}`} surah={segment.surah} lineNumber={rowNumber} />
            );
          }
          if (segment.kind === "basmala") {
            rowNumber += 1;
            return (
              <BasmalaLine
                key={`b${index}`}
                surah={segment.surah}
                lineNumber={rowNumber}
                riwaya={riwaya}
                fallbackFontFamily={fallbackFontFamily}
              />
            );
          }
          return (
            <div key={`f${index}`} className="qcm-flow" data-flow-index={index}>
              {segment.tokens.flatMap((token, tokenIndex) => [
                renderToken(token, tokenIndex),
                " ",
              ])}
            </div>
          );
        })}
      </div>
    </MushafPageShell>
  );
}
