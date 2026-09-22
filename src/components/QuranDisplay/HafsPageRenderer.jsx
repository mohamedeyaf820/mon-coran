import React, { useEffect, useMemo, useState } from "react";
import {
  ensureFontLoaded,
  ensureQcfPageFontLoaded,
  getQcfPageFontFamily,
} from "../../services/fontLoader";
import {
  getQuranWordTextForFont,
  normalizeFontId,
  resolveFontFamily,
} from "../../data/fonts";
import { getJuzOpeningAtAyah } from "../../data/juz";
import { playWordAudio } from "../../utils/wordAudio";
import MushafAyahMarker from "./MushafAyahMarker";
import MushafFlowPage, { buildFlowSegments } from "./MushafFlowPage";
import MushafPageLines from "./MushafPageLines";
import MushafPageShell from "./MushafPageShell";
import {
  getPageMeta,
  getVerseKey,
  markSurahEndings,
  placeSurahOpenings,
} from "./mushafPageComposition";

function decodeHtmlEntity(str) {
  if (!str) return "";
  return String(str)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function getWordGlyph(word, version) {
  if (version === "v1") return word.codeV1 || word.codeV2 || "";
  // The coloured v4 face is the COLRv1 cut of the same page font: it is read
  // with the code_v2 glyphs, only the file differs.
  return word.codeV2 || word.codeV1 || "";
}

function getLineNumber(word) {
  const lineNumber = Number(word?.lineNumber || word?.lineV2 || word?.lineV1);
  return Number.isFinite(lineNumber) && lineNumber > 0 ? lineNumber : null;
}

// Hafs words arrive already positioned: the Quran.com words API carries a
// line number per glyph, so the page is grouped straight from that data.
function groupPageLines(ayahs) {
  const lines = new Map();
  const seenEndMarkers = new Set();

  ayahs.forEach((ayah) => {
    const surah = ayah.surah?.number;
    const ayahNum = ayah.numberInSurah;
    const words = Array.isArray(ayah.words) ? ayah.words : [];

    words.forEach((word) => {
      const lineNumber = getLineNumber(word);
      if (!lineNumber) return;
      const charType = word.charType || word.charTypeName || word.char_type_name;
      const endKey = `${surah}:${ayahNum}`;
      if (charType === "end") {
        if (seenEndMarkers.has(endKey)) return;
        seenEndMarkers.add(endKey);
      }
      if (!lines.has(lineNumber)) lines.set(lineNumber, []);
      lines.get(lineNumber).push({
        ...word,
        charType,
        globalAyah: ayah.number,
        surah: word.surah || surah,
        ayah: word.ayah || ayahNum,
      });
    });
  });

  const pageLines = Array.from({ length: 15 }, (_, index) => {
    const lineNumber = index + 1;
    return {
      lineNumber,
      words: lines.get(lineNumber) || [],
    };
  });
  return markSurahEndings(placeSurahOpenings(pageLines));
}

// The printed sheet is cut with per-page QCF glyph fonts; only the explicit
// Madani-page id asks for it. "QPC Uthmani Hafs" is the same Uthmanic face set
// as continuous text, the way Quran.com and the other mushaf sites lay a page
// out, so the default reads as flowing text that fills the column.
const PAGE_GLYPH_FONT_IDS = new Set([
  "qpc-madani-page",
  "qcf-v1",
  "qcf-v2",
  "qcf-v4-tajweed",
  "mushaf-tajweed",
]);

// The one question the page stream asks before spending a font request: does
// the chosen face actually print the sheet with per-page glyph files? Warsh has
// no such cut, and a proportional Hafs face flows, so both must skip it.
export function usesMushafPageGlyphs(fontFamily, riwaya) {
  return riwaya === "hafs" && PAGE_GLYPH_FONT_IDS.has(normalizeFontId(fontFamily, riwaya));
}

function getHafsFlowWords(ayah, fontFamily, riwaya) {
  const words = Array.isArray(ayah?.words) ? ayah.words : [];
  return words
    .filter((word) => (word.charType || word.charTypeName || word.char_type_name) !== "end")
    .map((word) => getQuranWordTextForFont(word, fontFamily, riwaya))
    .filter(Boolean);
}

export default function HafsPageRenderer({
  activeAyah,
  ayahs,
  currentPage,
  currentPlayingAyah,
  fontFamily,
  lang,
  onToggleActive,
  riwaya,
  showTajwid,
}) {
  // Tajweed switches the sheet to the coloured COLRv1 cut of the same page
  // font. Not every page has a v4 file, so the plain face stays as the
  // fallback rather than failing the sheet.
  const [resolvedVersion, setResolvedVersion] = useState("v2");
  const requestedVersion = showTajwid ? "v4" : "v2";
  const usesPageGlyphs = usesMushafPageGlyphs(fontFamily, riwaya);
  const pageFontFamily = getQcfPageFontFamily(currentPage, resolvedVersion);
  const fallbackFontFamily = resolveFontFamily(fontFamily, riwaya);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [fontFailed, setFontFailed] = useState(false);

  const lines = useMemo(() => groupPageLines(ayahs), [ayahs]);
  const flowSegments = useMemo(
    () =>
      usesPageGlyphs
        ? []
        : buildFlowSegments(ayahs, {
            getWords: (ayah) => getHafsFlowWords(ayah, fontFamily, riwaya),
            riwaya: "hafs",
            showTajwid,
          }),
    [ayahs, fontFamily, riwaya, showTajwid, usesPageGlyphs],
  );
  const meta = useMemo(
    () => getPageMeta(ayahs, currentPage, lang),
    [ayahs, currentPage, lang, riwaya],
  );

  useEffect(() => {
    if (usesPageGlyphs) return undefined;
    let cancelled = false;
    setFontLoaded(false);
    ensureFontLoaded(normalizeFontId(fontFamily, riwaya)).then((result) => {
      if (!cancelled) setFontLoaded(Boolean(result.loaded || result.cached));
    });
    return () => {
      cancelled = true;
    };
  }, [fontFamily, riwaya, usesPageGlyphs]);

  useEffect(() => {
    if (!usesPageGlyphs) return undefined;
    let cancelled = false;
    setFontLoaded(false);
    setFontFailed(false);
    ensureQcfPageFontLoaded(currentPage, requestedVersion).then((result) => {
      if (cancelled) return;
      const loaded = Boolean(result.loaded || result.cached);
      if (requestedVersion === "v4" && !loaded) {
        return ensureQcfPageFontLoaded(currentPage, "v2").then((plain) => {
          if (cancelled) return;
          const plainLoaded = Boolean(plain.loaded || plain.cached);
          setResolvedVersion("v2");
          setFontLoaded(plainLoaded);
          setFontFailed(!plainLoaded);
        });
      }
      setResolvedVersion(requestedVersion);
      setFontLoaded(loaded);
      setFontFailed(!loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [currentPage, requestedVersion, usesPageGlyphs]);

  const renderWord = (word, index) => {
    const verseKey = getVerseKey(word);
    const isPlaying =
      currentPlayingAyah?.surah === word.surah &&
      currentPlayingAyah?.ayah === word.ayah;
    const isActive = activeAyah === word.globalAyah;

    if (word.charType === "end") {
      const juzOpening = getJuzOpeningAtAyah(word.surah, word.ayah);
      return (
        <MushafAyahMarker
          key={`${verseKey}:end:${index}`}
          num={word.ayah}
          isPlaying={isPlaying}
          juz={Boolean(juzOpening)}
          onClick={onToggleActive ? () => onToggleActive(word.globalAyah) : undefined}
        />
      );
    }

    const glyph = getWordGlyph(word, resolvedVersion);
    return (
      <span
        key={`${verseKey}:${word.position ?? `x${index}`}`}
        className={`qcm-word${isPlaying ? " qcm-word--playing" : ""}${isActive ? " qcm-word--active" : ""}`}
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
          fontFamily: fontLoaded ? pageFontFamily : fallbackFontFamily,
        }}
      >
        {decodeHtmlEntity(
          fontLoaded && glyph
            ? glyph
            : getQuranWordTextForFont(word, fontFamily, riwaya)
        )}
      </span>
    );
  };

  if (!usesPageGlyphs) {
    return (
      <MushafFlowPage
        activeAyah={activeAyah}
        currentPage={currentPage}
        currentPlayingAyah={currentPlayingAyah}
        fallbackFontFamily={fallbackFontFamily}
        fitSignal={`${fontLoaded}|${fontFamily}|${showTajwid ? "t" : "-"}`}
        fontFamily={fontFamily}
        lang={lang}
        meta={meta}
        onToggleActive={onToggleActive}
        riwaya={riwaya}
        segments={flowSegments}
        showTajwid={showTajwid}
      />
    );
  }

  return (
    <MushafPageShell
      currentPage={currentPage}
      fontFailed={fontFailed}
      fontWarningText={lang === "ar"
        ? "تعذّر تحميل الخط — يُعرض النص بخط بديل"
        : lang === "fr"
          ? "Police non chargée — affichage en mode texte"
          : "Font failed to load — showing text fallback"}
      lang={lang}
      meta={meta}
    >
      <MushafPageLines
        fallbackFontFamily={fallbackFontFamily}
        lines={lines}
        renderWord={renderWord}
        riwaya={riwaya}
        tajweed={showTajwid}
      />
    </MushafPageShell>
  );
}
