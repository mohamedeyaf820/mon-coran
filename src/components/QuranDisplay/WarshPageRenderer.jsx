import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ensureFontLoaded } from "../../services/fontLoader";
import { resolveFontFamily, stripEmbeddedAyahMarkers } from "../../data/fonts";
import { playWordAudio } from "../../utils/wordAudio";
import AyahMarker from "../Quran/AyahMarker";
import MushafPageLines from "./MushafPageLines";
import MushafPageShell from "./MushafPageShell";
import {
  getPageMeta,
  getVerseKey,
  markSurahEndings,
  normalizeArabicText,
  placeSurahOpenings,
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

// Words of a Warsh ayah flow across the printed lines the dataset records in
// line_start/line_end (Madinah Mushaf, 15 lines per page). Those fields are
// per-ayah, so multi-line ayahs distribute their words evenly inside their own
// line range — the only layout claim the data supports. Ayahs missing the
// metadata continue the flow from the previous line end instead of being
// poured into a global grid.
const WARSH_PAGE_LINES = 15;
const WARSH_FALLBACK_WORDS_PER_LINE = 12;

function groupWarshPageLines(ayahs) {
  const linesByNumber = new Map();
  let cursor = 1;

  const push = (lineNumber, token) => {
    if (!linesByNumber.has(lineNumber)) linesByNumber.set(lineNumber, []);
    linesByNumber.get(lineNumber).push(token);
  };

  ayahs.forEach((ayah) => {
    const surah = ayah.surah?.number;
    const ayahNum = ayah.numberInSurah;
    const warshWords = getCleanWarshWords(ayah);
    if (warshWords.length === 0) return;

    const metaStart = Number(ayah.lineStart) > 0 ? Number(ayah.lineStart) : null;
    const metaEnd = Number(ayah.lineEnd) > 0 ? Number(ayah.lineEnd) : null;
    const lineStart = Math.max(1, Math.min(WARSH_PAGE_LINES, metaStart ?? cursor));
    const lineEnd = Math.max(
      lineStart,
      Math.min(
        WARSH_PAGE_LINES,
        metaEnd ??
          lineStart + Math.ceil((warshWords.length + 1) / WARSH_FALLBACK_WORDS_PER_LINE) - 1,
      ),
    );
    cursor = Math.min(WARSH_PAGE_LINES, lineEnd + 1);

    const lineCount = lineEnd - lineStart + 1;
    const lastIndex = warshWords.length - 1;
    warshWords.forEach((text, idx) => {
      // Even flow inside the ayah's own lines; the last word and the end
      // marker always close on lineEnd, as in the printed mushaf.
      const lineNumber =
        idx === lastIndex
          ? lineEnd
          : Math.min(lineEnd, lineStart + Math.floor((idx * lineCount) / warshWords.length));
      push(lineNumber, {
        charType: "word",
        globalAyah: ayah.number,
        surah,
        ayah: ayahNum,
        position: idx + 1,
        text,
        isWarsh: true,
      });
    });

    push(lineEnd, {
      charType: "end",
      globalAyah: ayah.number,
      surah,
      ayah: ayahNum,
      isWarsh: true,
    });
  });

  const pageLines = Array.from({ length: WARSH_PAGE_LINES }, (_, index) => ({
    lineNumber: index + 1,
    words: linesByNumber.get(index + 1) || [],
  }));

  return markSurahEndings(placeSurahOpenings(pageLines, { warsh: true }));
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
  const [lineFits, setLineFits] = useState({});
  const linesRef = useRef(null);

  const lines = useMemo(() => groupWarshPageLines(ayahs), [ayahs]);
  const meta = useMemo(
    () => getPageMeta(ayahs, currentPage, lang, riwaya),
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
  const fitsRef = useRef({});
  fitsRef.current = lineFits;

  useLayoutEffect(() => {
    if (!linesRef.current) return undefined;

    // A new page or line set restarts the refinement budget; a fit update
    // alone keeps refining until every row converges inside its box instead
    // of stopping after a single pass that still overflows.
    const inputKey = `${currentPage}|${fontLoaded}|${lines.length}`;
    if (fitKeyRef.current !== inputKey) {
      fitKeyRef.current = inputKey;
      fitPassRef.current = 0;
    }
    if (fitPassRef.current >= 8) return undefined;

    let frame = 0;
    let timer = 0;
    let disposed = false;

    const measure = () => {
      if (disposed || fitPassRef.current >= 8) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (disposed || !linesRef.current) return;
        const next = {};
        let stable = true;
        linesRef.current.querySelectorAll(".qcm-line").forEach((line) => {
          const children = [...line.children];
          if (children.length === 0) return;
          const lineRect = line.getBoundingClientRect();
          const currentScale = Number.parseFloat(
            getComputedStyle(line).getPropertyValue("--qcm-line-fit"),
          ) || 1;
          const left = Math.min(...children.map((child) => child.getBoundingClientRect().left));
          const right = Math.max(...children.map((child) => child.getBoundingClientRect().right));
          const naturalWidth = Math.max(1, (right - left) / currentScale);
          // No readability floor: glyphs that cannot fit would spill outside
          // the ornamental frame, which no printed mushaf ever allows. Small
          // text stays inside; clipped text never would.
          const fit = Math.max(0.05, Math.min(1, (lineRect.width - 6) / naturalWidth));
          const key = line.dataset.lineNumber;
          next[key] = fit;
          if (Math.abs((fitsRef.current[key] || 1) - fit) >= 0.004) stable = false;
        });
        if (stable || disposed) return;
        fitPassRef.current += 1;
        setLineFits(next);
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          if (!disposed) measure();
        }, 120);
      });
    };

    measure();
    const onResize = () => {
      fitKeyRef.current = "";
      fitsRef.current = {};
      setLineFits({});
    };
    window.addEventListener("resize", onResize);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [currentPage, fontLoaded, lines]);

  const renderWord = (word, index) => {
    const verseKey = getVerseKey(word);
    const isPlaying =
      currentPlayingAyah?.surah === word.surah &&
      currentPlayingAyah?.ayah === word.ayah;
    const isActive = activeAyah === word.globalAyah;

    if (word.charType === "end") {
      return (
        <AyahMarker
          key={`${verseKey}:end:${index}`}
          num={word.ayah}
          isPlaying={isPlaying}
          className="qcm-ayah-marker"
          size="1.04em"
          onClick={onToggleActive ? () => onToggleActive(word.globalAyah) : undefined}
        />
      );
    }

    return (
      <span
        key={`${verseKey}:${word.position || index}:warsh`}
        className={`qcm-word qcm-word--warsh${isPlaying ? " qcm-word--playing" : ""}${isActive ? " qcm-word--active" : ""}`}
        data-surah-number={word.surah}
        data-ayah-number={word.ayah}
        data-ayah-global={word.globalAyah}
        data-word-position={word.position}
        role="button"
        tabIndex={0}
        onClick={() => {
          playWordAudio(word.audioUrl || { surah: word.surah, ayah: word.ayah, position: word.position });
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            playWordAudio(word.audioUrl || { surah: word.surah, ayah: word.ayah, position: word.position });
          }
        }}
        style={{
          fontFamily: 'var(--font-quran)',
          fontSize: '1em',
          lineHeight: 'inherit',
          letterSpacing: 0,
          wordSpacing: 0,
          textRendering: 'optimizeLegibility',
          WebkitFontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1, "mark" 1, "mkmk" 1',
          fontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1, "mark" 1, "mkmk" 1',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          unicodeBidi: 'isolate',
          whiteSpace: 'nowrap',
          marginInlineEnd: '0.035em',
        }}
      >
        {normalizeArabicText(word.text)}
      </span>
    );
  };

  return (
    <MushafPageShell currentPage={currentPage} lang={lang} meta={meta}>
      <MushafPageLines
        fallbackFontFamily={fallbackFontFamily}
        lineStyleFor={(lineNumber) => ({ "--qcm-line-fit": lineFits[lineNumber] || 1 })}
        lines={lines}
        linesRef={linesRef}
        renderWord={renderWord}
        riwaya={riwaya}
        warsh
      />
    </MushafPageShell>
  );
}
