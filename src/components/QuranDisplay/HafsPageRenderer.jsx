import React, { useEffect, useMemo, useState } from "react";
import {
  ensureQcfPageFontLoaded,
  getQcfPageFontFamily,
} from "../../services/fontLoader";
import { getQuranWordTextForFont, resolveFontFamily } from "../../data/fonts";
import { playWordAudio } from "../../utils/wordAudio";
import AyahMarker from "../Quran/AyahMarker";
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
  const version = showTajwid ? "v4" : "v2";
  const pageFontFamily = getQcfPageFontFamily(currentPage, version);
  const fallbackFontFamily = resolveFontFamily(fontFamily, riwaya);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [fontFailed, setFontFailed] = useState(false);

  const lines = useMemo(() => groupPageLines(ayahs), [ayahs]);
  const meta = useMemo(
    () => getPageMeta(ayahs, currentPage, lang, riwaya),
    [ayahs, currentPage, lang, riwaya],
  );

  useEffect(() => {
    let cancelled = false;
    setFontLoaded(false);
    setFontFailed(false);
    ensureQcfPageFontLoaded(currentPage, version).then((result) => {
      if (!cancelled) {
        const loaded = Boolean(result.loaded || result.cached);
        setFontLoaded(loaded);
        setFontFailed(!loaded);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentPage, version]);

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

    const glyph = getWordGlyph(word, version);
    return (
      <span
        key={`${verseKey}:${word.position || index}`}
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
      />
    </MushafPageShell>
  );
}
