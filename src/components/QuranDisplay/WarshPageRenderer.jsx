import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ensureFontLoaded } from "../../services/fontLoader";
import { resolveFontFamily, stripEmbeddedAyahMarkers } from "../../data/fonts";
import { playWordAudio } from "../../utils/wordAudio";
import AyahMarker from "../Quran/AyahMarker";
import { t } from "../../i18n";
import { BasmalaLine, SurahHeaderLine } from "./MushafPageLines";
import MushafPageShell from "./MushafPageShell";
import {
  getPageMeta,
  getVerseKey,
  normalizeArabicText,
} from "./mushafPageComposition";

function getCleanWarshWords(ayah) {
  const source = Array.isArray(ayah?.warshWords) && ayah.warshWords.length > 0
    ? ayah.warshWords
        .map((word) => typeof word === "string" ? word : word?.text || "")
        .join(" ")
    : ayah?.text || "";
  return stripEmbeddedAyahMarkers(normalizeArabicText(source), {
    ayahNumber: ayah?.numberInSurah,
  })
    .split(/\s+/u)
    .filter(Boolean);
}

// Warsh prints like the Madinah mushaf: the ayahs of a surah flow across the
// page as one continuous, justified body — a new ayah starts right after the
// previous end marker, wherever that falls on the line — and the page fills
// exactly fifteen lines. Line breaks are therefore typographic (the browser
// breaks the flow, justification stretches the word spaces to the measure),
// never a per-ayah claim the dataset cannot support. A surah opening breaks
// the flow for its title band and basmala, then a fresh flow segment starts
// below, and the short last line of each segment is centred, as printed.
const WARSH_PAGE_LINES = 15;
// Smallest legible Warsh type, as a fraction of the page body size: below it
// the page reports a degraded fit instead of printing micro-glyphs.
const WARSH_MIN_LINE_FIT = 0.45;
const WARSH_MAX_LINE_FIT = 1.6;

function buildWarshSegments(ayahs) {
  const segments = [];
  let flow = null;

  ayahs.forEach((ayah) => {
    const surah = ayah.surah?.number;
    const ayahNum = ayah.numberInSurah;
    const words = getCleanWarshWords(ayah);
    if (words.length === 0) return;

    if (Number(ayahNum) === 1) {
      segments.push({ kind: "surah-header", surah });
      // Every Warsh surah but At-Tawbah carries its own basmala band, and
      // in the Warsh count the Fatiha basmala is not verse 1.
      if (Number(surah) !== 9) segments.push({ kind: "basmala", surah });
      flow = null;
    }
    if (!flow) {
      flow = { kind: "flow", tokens: [] };
      segments.push(flow);
    }
    words.forEach((text, idx) => {
      flow.tokens.push({
        charType: "word",
        globalAyah: ayah.number,
        surah,
        ayah: ayahNum,
        position: idx + 1,
        text,
        isWarsh: true,
      });
    });
    flow.tokens.push({
      charType: "end",
      globalAyah: ayah.number,
      surah,
      ayah: ayahNum,
      isWarsh: true,
    });
  });

  return segments;
}

export default function WarshPageRenderer({
  activeAyah,
  ayahs,
  currentPage,
  currentPlayingAyah,
  fontFamily,
  lang,
  onToggleActive,
  riwaya,
}) {
  // Warsh words are proportional text in a web font, not QCF cut glyphs: the
  // font file must load, but a failure still renders readable text, so the
  // sheet never shows the QCF font warning. Load completion only matters as a
  // re-measure signal for the fit loop.
  const fallbackFontFamily = resolveFontFamily(fontFamily, riwaya);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [flowFit, setFlowFit] = useState(1);
  const [fitDegraded, setFitDegraded] = useState(false);
  const linesRef = useRef(null);

  const segments = useMemo(() => buildWarshSegments(ayahs), [ayahs]);
  const meta = useMemo(
    () => getPageMeta(ayahs, currentPage, lang),
    [ayahs, currentPage, lang, riwaya],
  );

  useEffect(() => {
    let cancelled = false;
    setFontLoaded(false);
    // Load the Warsh font file so --font-quran resolves correctly.
    // fontFamily defaults to "qpc-warsh" when not supplied.
    const warshFontId = fontFamily || "qpc-warsh";
    ensureFontLoaded(warshFontId).then((result) => {
      if (!cancelled) {
        setFontLoaded(Boolean(result.loaded || result.cached));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fontFamily]);

  const fitPassRef = useRef(0);
  const fitKeyRef = useRef("");

  useLayoutEffect(() => {
    if (!linesRef.current) return undefined;

    // A new page, font load or segment set restarts the refinement budget.
    // Row count is proportional to the type size (bigger glyphs fit fewer
    // words per line), so each pass multiplies the fit by target/rows until
    // the segments fill exactly the fifteen printed lines.
    const inputKey = `${currentPage}|${fontLoaded}|${segments.length}|${ayahs.length}`;
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
        const target = WARSH_PAGE_LINES - openingRows;
        let rows = 0;
        flows.forEach((flow) => {
          const pitch = Number.parseFloat(getComputedStyle(flow).lineHeight) || 1;
          rows += Math.max(1, Math.round(flow.offsetHeight / pitch));
        });
        if (target <= 0) return;

        setFlowFit((current) => {
          const next = Math.min(
            WARSH_MAX_LINE_FIT,
            Math.max(WARSH_MIN_LINE_FIT, current * (target / rows)),
          );
          if (Math.abs(next - current) < 0.004) {
            // Converged: degraded only when the floor still overflows the
            // fifteen-line budget instead of silently printing a taller page.
            setFitDegraded(current <= WARSH_MIN_LINE_FIT + 0.001 && rows > target);
            fitPassRef.current = 10;
            return current;
          }
          fitPassRef.current += 1;
          if (fitPassRef.current < 10) {
            window.setTimeout(measure, 60);
          } else {
            setFitDegraded(next <= WARSH_MIN_LINE_FIT + 0.001 && rows > target);
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
  }, [currentPage, fontLoaded, segments, ayahs.length]);

  const renderToken = (token, index) => {
    const verseKey = getVerseKey(token);
    const isPlaying =
      currentPlayingAyah?.surah === token.surah &&
      currentPlayingAyah?.ayah === token.ayah;
    const isActive = activeAyah === token.globalAyah;

    if (token.charType === "end") {
      return (
        <AyahMarker
          key={`${verseKey}:end:${index}`}
          num={token.ayah}
          isPlaying={isPlaying}
          className="qcm-ayah-marker"
          size="1.04em"
          onClick={onToggleActive ? () => onToggleActive(token.globalAyah) : undefined}
        />
      );
    }

    return (
      <span
        key={`${verseKey}:${token.position || index}:warsh`}
        className={`qcm-word qcm-word--warsh${isPlaying ? " qcm-word--playing" : ""}${isActive ? " qcm-word--active" : ""}`}
        data-surah-number={token.surah}
        data-ayah-number={token.ayah}
        data-ayah-global={token.globalAyah}
        data-word-position={token.position}
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
          fontFamily: 'var(--font-quran)',
          fontSize: '1em',
          lineHeight: 'inherit',
          letterSpacing: 0,
          textRendering: 'optimizeLegibility',
          WebkitFontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1, "mark" 1, "mkmk" 1',
          fontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1, "mark" 1, "mkmk" 1',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          unicodeBidi: 'isolate',
          whiteSpace: 'nowrap',
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
      lang={lang}
      meta={meta}
    >
      <div
        ref={linesRef}
        className="qcm-lines"
        dir="rtl"
        lang="ar"
        data-warsh="true"
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
