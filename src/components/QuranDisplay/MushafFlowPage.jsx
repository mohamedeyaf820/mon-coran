import React, { useLayoutEffect, useRef, useState } from "react";
import { getPerWordTajweedRanges } from "../../data/tajwidRules";
import { CLIP_PAINT_SUPPORTED, paintTajweedWord, clearTajweedWordPaint } from "../../utils/tajweedWordPaint";
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
const MIN_LEGIBLE_FLOW_PX = 22;
// Converged type size per sheet, keyed by what the fit actually depends on: the
// page, the reader's settings signal, the measure it was laid out in and its
// token count. Without it every remount restarts from 1 and re-runs the whole
// refinement — the type visibly resizes each time a page comes back into view,
// and each of those passes re-styles every word on the sheet.
const FIT_CACHE_LIMIT = 240;
const fitCache = new Map();
// The constant part of a flow word: identical reference for every word, so React
// skips the style diff instead of re-resolving twelve declarations per word on
// every pass that touches the sheet.
const FLOW_WORD_STYLE = Object.freeze({
  // --qd-font-family is the reader's own choice. --font-quran cannot be the only
  // source: the Warsh display element re-declares it above the inline stamp, so
  // it resolves to the fixed Madinah stack and every face in the picker prints
  // as KFGQPC Warsh.
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
});

/**
 * Turn ayahs into flow segments. `getWords(ayah)` returns the printable word
 * list for the riwaya and face in use; rule ranges are local to each word.
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
    const normalizedWords = words.map(normalizeArabicText);
    const rules = showTajwid
      ? getPerWordTajweedRanges(normalizedWords, riwaya)
      : [];
    normalizedWords.forEach((text, idx) => {
      flow.tokens.push({
        charType: "word",
        globalAyah: ayah.number,
        surah,
        ayah: ayahNum,
        position: idx + 1,
        text,
        tajweedRanges: rules[idx] || [],
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
  fontReady = true,
  fitSignal,
  fontFamily,
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
  const [fitDegraded, setFitDegraded] = useState(false);
  const linesRef = useRef(null);
  const fitRef = useRef(1);
  const fitPassRef = useRef(0);
  const fitKeyRef = useRef("");

  useLayoutEffect(() => {
    if (!showTajwid || !fontReady) return undefined;
    const root = linesRef.current;
    if (!root) return undefined;
    const words = new Map(Array.from(root.querySelectorAll("[data-tajweed-key]"),
      (element) => [element.getAttribute("data-tajweed-key"), element]));
    const painted = [];
    for (const segment of segments) {
      if (segment.kind !== "flow") continue;
      for (const token of segment.tokens) {
        if (token.charType !== "word" || !token.tajweedRanges.length) continue;
        const key = `${token.globalAyah}:${token.position}`;
        const word = words.get(key);
        if (word?.firstChild?.data === token.text) {
          painted.push([word, token.tajweedRanges, token.tajweedRanges[0]?.ruleId]);
        }
      }
    }
    let frame = 0;
    // WebKit clips a text gradient to a few glyph fragments and leaves the
    // fill transparent, so there the flow words take their first rule's
    // colour whole instead of band by band.
    const repaint = () =>
      painted.forEach(([word, ranges, ruleId]) => {
        if (CLIP_PAINT_SUPPORTED) paintTajweedWord(word, ranges);
        else if (/^[a-z-]+$/.test(ruleId || "")) word.style.color = `var(--tajwid-${ruleId})`;
      });
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(repaint);
    };
    repaint();
    const observer = new ResizeObserver(schedule);
    root.querySelectorAll(".qcm-flow").forEach((flow) => observer.observe(flow));
    window.addEventListener("resize", schedule);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
      painted.forEach(([word]) => {
        clearTajweedWordPaint(word);
        word.style.removeProperty("color");
      });
    };
  }, [segments, showTajwid, fontReady]);

  useLayoutEffect(() => {
    if (!linesRef.current) return undefined;

    // The fit is written straight onto the measured node rather than through
    // state: a pass that changed the type size used to re-render the sheet, and
    // the sheet is hundreds of word spans. Refinement then costs one React
    // commit per pass on top of the style recalculation the new size needs.
    const beginPass = () => {
      const root = linesRef.current;
      if (!root) return null;
      // A new page, font, measure or segment set restarts the refinement budget.
      // Row count is proportional to the type size (bigger glyphs fit fewer words
      // per line), so each pass multiplies the fit by target/rows until the
      // segments fill exactly the fifteen printed lines.
      const inputKey = `${currentPage}|${fitSignal}|${Math.round(root.clientWidth)}|${segments.length}`;
      if (fitKeyRef.current !== inputKey) {
        fitKeyRef.current = inputKey;
        fitPassRef.current = 0;
        // Revisiting a sheet starts from the size that already converged for it,
        // so the first painted frame is correct and one pass is enough to prove
        // it; only a genuinely new page pays for the refinement.
        fitRef.current = fitCache.get(inputKey) ?? 1;
        root.style.setProperty("--qcm-flow-fit", String(fitRef.current));
      }
      return fitPassRef.current < 10 ? { root, inputKey } : null;
    };

    let frame = 0;
    let disposed = false;

    const measure = () => {
      if (disposed) return;
      const started = beginPass();
      if (!started) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (disposed) return;
        const pass = beginPass();
        if (!pass) return;
        const { root, inputKey } = pass;
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

        const apply = (value) => {
          fitRef.current = value;
          root.style.setProperty("--qcm-flow-fit", String(value));
        };
        const current = fitRef.current;
        // The legibility floor outranks the no-growth ceiling: on a narrow
        // phone the measured body can fall below readable size before the fit, so
        // capping at 1 there would print micro-glyphs. Growth is allowed
        // only up to what legibility demands, never to reach fifteen lines.
        const next = Math.max(floor, Math.min(MAX_LINE_FIT, current * (target / rows)));
        // The notice fires only when the legibility floor holds the type up and
        // the page therefore runs past fifteen lines.
        const degraded = (value) => value <= floor + 0.001 && rows > target;

        if (Math.abs(next - current) < 0.004) {
          fitPassRef.current = 10;
          if (fitCache.size >= FIT_CACHE_LIMIT) fitCache.delete(fitCache.keys().next().value);
          fitCache.set(inputKey, current);
          setFitDegraded(degraded(current));
          return;
        }
        fitPassRef.current += 1;
        apply(next);
        if (fitPassRef.current >= 10) {
          if (fitCache.size >= FIT_CACHE_LIMIT) fitCache.delete(fitCache.keys().next().value);
          fitCache.set(inputKey, next);
          setFitDegraded(degraded(next));
        } else {
          window.setTimeout(measure, 60);
        }
      });
    };

    measure();
    const onResize = () => {
      // A different measure is a different cache key: beginPass reseeds from the
      // width being asked for now, or from 1 when it has never been laid out.
      fitKeyRef.current = "";
      fitPassRef.current = 0;
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
          fontFamily={fontFamily}
          riwaya={riwaya}
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
        data-tajweed-key={`${token.globalAyah}:${token.position}`}
        role="button"
        tabIndex={0}
        onClick={() => {
          if (riwaya === "warsh") onToggleActive?.(token.globalAyah);
          else playWordAudio(token.audioUrl || { surah: token.surah, ayah: token.ayah, position: token.position });
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (riwaya === "warsh") onToggleActive?.(token.globalAyah);
            else playWordAudio(token.audioUrl || { surah: token.surah, ayah: token.ayah, position: token.position });
          }
        }}
        style={FLOW_WORD_STYLE}
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
        data-font-ready={fontReady ? "true" : "false"}
        data-warsh={riwaya === "warsh" ? "true" : undefined}
        data-tajweed={showTajwid ? "on" : undefined}
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
